import { useCallback, useState, useMemo, useEffect } from 'react'
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import { useEntityList } from './useEntityList'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

export function useClubList(initialSearch: string = '', refreshTrigger: number = 0) {
  const [initialOrder, setInitialOrder] = useState<string[] | null>(null)
  const { user } = useAuth()
  const isEncargado = user?.rol === ROL.ENCARGADO
  const userClubId = user?.club_id

  const filterFn = useCallback((c: Club, filters: Record<string, string>, search: string) => {
    const matchMunicipio = filters.municipio === 'all' || c.provincia === filters.municipio
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? c.activo : !c.activo)
    const normalizedSearch = search.toLowerCase()
    const matchSearch = Boolean(!normalizedSearch || 
      c.nombre_club?.toLowerCase().includes(normalizedSearch) ||
      c.provincia?.toLowerCase().includes(normalizedSearch) ||
      c.direccion?.toLowerCase().includes(normalizedSearch) ||
      c.telefono_contacto?.toLowerCase().includes(normalizedSearch))

    return Boolean(matchMunicipio && matchEstado && matchSearch)
  }, [])

  const entityList = useEntityList<Club>({
    queryKey: ['clubes', refreshTrigger.toString()],
    fetchItems: async () => await clubController.getAllClubes(true),
    updateItemStatus: async (id, activo) => {
      const resp = await clubController.updateClub(id, { activo })
      return { success: resp.success, error: resp.error }
    },
    filterFn,
    initialFilters: { municipio: 'all', estado: 'all' },
    initialSearch,
    enabled: !!user
  })

  // Estabilizar el orden inicial para evitar saltos al cambiar el estado
  useEffect(() => {
    // Si la lista ha cargado y el orden NO está establecido aún, lo fijamos.
    if (!entityList.state.loading && entityList.items.length > 0 && initialOrder === null) {
      const sortedIds = [...entityList.items]
        .sort((a, b) => {
          // 1. Prioridad por estado (activos primero)
          const aActivo = a.activo ?? true;
          const bActivo = b.activo ?? true;
          if (aActivo !== bActivo) return aActivo ? -1 : 1;
          
          // 2. Orden alfabético por nombre del club
          const nombreA = (a.nombre_club || '').trim().toLowerCase();
          const nombreB = (b.nombre_club || '').trim().toLowerCase();
          
          return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        })
        .map(item => item.id);
      setInitialOrder(sortedIds);
    }
  }, [entityList.items, initialOrder, entityList.state.loading]);

  // Si se presiona el botón de refrescar, resetear el orden para que se aplique el nuevo
  useEffect(() => {
    setInitialOrder(null);
  }, [refreshTrigger]);

  // Obtener data con orden diferido (basado en el orden capturado al cargar)
  const filteredData = useMemo(() => {
    const dataToDisplay = [...entityList.filteredData];

    if (!initialOrder) {
      // Si aún no hay orden capturado, usamos el orden por defecto
      return dataToDisplay.sort((a, b) => {
        const aActivo = a.activo ?? true;
        const bActivo = b.activo ?? true;
        if (aActivo !== bActivo) return aActivo ? -1 : 1;

        const nombreA = (a.nombre_club || '').trim().toLowerCase();
        const nombreB = (b.nombre_club || '').trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
      });
    }

    // Usar el orden capturado
    const orderMap = new Map(initialOrder.map((id, index) => [id, index]));
    
    return dataToDisplay.sort((a, b) => {
      const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
      const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
      
      if (indexA !== indexB) return indexA - indexB;

      // Desempate para items nuevos
      const nombreA = (a.nombre_club || '').trim().toLowerCase();
      const nombreB = (b.nombre_club || '').trim().toLowerCase();
      return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    });
  }, [entityList.filteredData, initialOrder]);

  // Retain the old shape so standard consumers don't break immediately
  const state = {
    ...entityList.state,
    clubes: entityList.items,
    municipioFilter: entityList.state.filters.municipio || 'all',
    estadoFilter: entityList.state.filters.estado || 'all',
  }

  const dispatch = useCallback((action: { type: string; payload?: any }) => {
    switch (action.type) {
      case 'SET_GLOBAL_FILTER': return entityList.setGlobalFilter(action.payload || '')
      case 'SET_MUNICIPIO_FILTER': return entityList.setFilter('municipio', action.payload || 'all')
      case 'SET_ESTADO_FILTER': return entityList.setFilter('estado', action.payload || 'all')
      case 'TOGGLE_SHOW_FILTERS': return entityList.toggleShowFilters()
      case 'CLEAR_FILTERS': return entityList.clearFilters()
      case 'SET_CLUBES': return entityList.setItems(action.payload || [])
    }
  }, [entityList])

  const loadClubes = entityList.loadItems

  return {
    state,
    dispatch,
    loadClubes,
    toggleStatus: entityList.toggleStatus,
    updateLocalClub: entityList.updateLocalItem,
    deleteLocalClub: entityList.deleteLocalItem,
    filteredData,
    entityList
  }
}
