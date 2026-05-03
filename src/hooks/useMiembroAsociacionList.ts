import { useCallback, useState, useMemo, useEffect } from 'react'
import { MiembroAsociacion } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import { useEntityList } from './useEntityList'

export function useMiembroAsociacionList(initialSearch: string = '', refreshTrigger: number = 0) {
  const [initialOrder, setInitialOrder] = useState<string[] | null>(null)

  const filterFn = useCallback((m: MiembroAsociacion, filters: Record<string, string>, search: string) => {
    const matchCargo = filters.cargo === 'all' || m.cargo === filters.cargo
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? m.activo : !m.activo)
    const normalizedSearch = search.toLowerCase()
    const matchSearch = Boolean(!normalizedSearch || 
      m.nombres?.toLowerCase().includes(normalizedSearch) ||
      m.apellidos?.toLowerCase().includes(normalizedSearch) ||
      m.ci?.toLowerCase().includes(normalizedSearch) ||
      m.ci_extension?.toLowerCase().includes(normalizedSearch) ||
      m.cargo?.toLowerCase().includes(normalizedSearch))

    return Boolean(matchCargo && matchEstado && matchSearch)
  }, [])

  const entityList = useEntityList<MiembroAsociacion>({
    queryKey: ['miembros-asociacion', refreshTrigger.toString()],
    fetchItems: async () => await asociacionController.getAllMiembros(true),
    updateItemStatus: async (id, activo) => {
      const resp = await asociacionController.updateMiembro(id, { activo } as any)
      return { success: resp.success, error: resp.error }
    },
    filterFn,
    initialFilters: { cargo: 'all', estado: 'all' },
    initialSearch
  })

  // Estabilizar el orden inicial para evitar saltos al cambiar el estado
  useEffect(() => {
    if (entityList.items.length > 0 && !initialOrder) {
      const sortedIds = [...entityList.items]
        .sort((a, b) => {
          const aActivo = a.activo ?? true;
          const bActivo = b.activo ?? true;
          if (aActivo !== bActivo) return aActivo ? -1 : 1;
          
          const nombreA = `${a.nombres} ${a.apellidos}`.trim().toLowerCase();
          const nombreB = `${b.nombres} ${b.apellidos}`.trim().toLowerCase();
          return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        })
        .map(item => item.id);
      setInitialOrder(sortedIds);
    }
  }, [entityList.items, initialOrder]);

  // Si se presiona el botón de refrescar, resetear el orden para que se aplique el nuevo
  useEffect(() => {
    setInitialOrder(null);
  }, [refreshTrigger]);

  // Obtener data con orden diferido (basado en el orden capturado al cargar)
  const filteredData = useMemo(() => {
    if (!initialOrder) {
        return [...entityList.filteredData].sort((a, b) => {
            const aActivo = a.activo ?? true;
            const bActivo = b.activo ?? true;
            if (aActivo !== bActivo) return aActivo ? -1 : 1;
            
            const nombreA = `${a.nombres} ${a.apellidos}`.trim().toLowerCase();
            const nombreB = `${b.nombres} ${b.apellidos}`.trim().toLowerCase();
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }

    // Crear un mapa para acceso rápido a la posición original
    const orderMap = new Map(initialOrder.map((id, index) => [id, index]));
    
    return [...entityList.filteredData].sort((a, b) => {
      const indexA = orderMap.get(a.id) ?? 999;
      const indexB = orderMap.get(b.id) ?? 999;
      return indexA - indexB;
    });
  }, [entityList.filteredData, initialOrder]);

  // Retain the old shape so standard consumers don't break immediately
  const state = {
    ...entityList.state,
    miembros: entityList.items,
    cargoFilter: entityList.state.filters.cargo || 'all',
    estadoFilter: entityList.state.filters.estado || 'all',
  }

  const dispatch = useCallback((action: any) => {
    switch (action.type) {
      case 'SET_GLOBAL_FILTER': return entityList.setGlobalFilter(action.payload)
      case 'SET_CARGO_FILTER': return entityList.setFilter('cargo', action.payload)
      case 'SET_ESTADO_FILTER': return entityList.setFilter('estado', action.payload)
      case 'TOGGLE_SHOW_FILTERS': return entityList.toggleShowFilters()
      case 'CLEAR_FILTERS': return entityList.clearFilters()
      case 'SET_MIEMBROS': return entityList.setItems(action.payload)
    }
  }, [entityList])

  const loadMiembros = entityList.loadItems

  return {
    state,
    dispatch,
    loadMiembros,
    toggleStatus: entityList.toggleStatus,
    updateLocalMiembro: entityList.updateLocalItem,
    deleteLocalMiembro: entityList.deleteLocalItem,
    filteredData,
    entityList
  }
}
