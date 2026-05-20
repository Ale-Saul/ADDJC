import { useCallback, useState, useEffect, useMemo } from 'react'
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
import { useEntityList } from './useEntityList'
import { useAuth } from './useAuth'

export function useArbitroList(initialSearch: string = '', refreshTrigger: number = 0) {
  const { user } = useAuth()
  const [initialOrder, setInitialOrder] = useState<string[] | null>(null)

  const filterFn = useCallback((a: Arbitro, filters: Record<string, string>, search: string) => {
    const matchNivel = filters.nivel === 'all' || a.nivel_arbitraje === filters.nivel
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? a.activo : !a.activo)
    const normalizedSearch = search.toLowerCase()
    const matchSearch = Boolean(!normalizedSearch || 
      a.nombres?.toLowerCase().includes(normalizedSearch) ||
      a.apellidos?.toLowerCase().includes(normalizedSearch) ||
      a.ci?.toLowerCase().includes(normalizedSearch) ||
      a.nivel_arbitraje?.toLowerCase().includes(normalizedSearch))

    return Boolean(matchNivel && matchEstado && matchSearch)
  }, [])

  const entityList = useEntityList<Arbitro>({
    queryKey: ['arbitros', refreshTrigger.toString()],
    fetchItems: async () => await arbitroController.getAllArbitros(true),
    updateItemStatus: async (id, activo) => {
      const resp = await arbitroController.updateArbitro(id, { 
        activo,
        updated_by: user?.id 
      } as any)
      // Aseguramos que devolvemos el objeto arbitro completo con el nombre del editor resuelto
      return { success: resp.success, error: resp.error, data: resp.data }
    },
    filterFn,
    initialFilters: { nivel: 'all', estado: 'all' },
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
          
          const nombreA = `${a.nombres || ''} ${a.apellidos || ''}`.trim().toLowerCase();
          const nombreB = `${b.nombres || ''} ${b.apellidos || ''}`.trim().toLowerCase();
          
          return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        })
        .map(item => item.id);
      setInitialOrder(sortedIds);
    }
  }, [entityList.items, initialOrder]);

  // Remover la dependencia de refreshTrigger para evitar que se resetee el orden mágicamente
  // a menos que los datos desaparezcan por completo
  useEffect(() => {
    if (entityList.items.length === 0) {
      setInitialOrder(null);
    }
  }, [entityList.items.length]);

  // Obtener data con orden diferido (basado en el orden capturado al cargar)
  const filteredData = useMemo(() => {
    if (!initialOrder) {
        return [...entityList.filteredData].sort((a, b) => {
            const aActivo = a.activo ?? true;
            const bActivo = b.activo ?? true;
            if (aActivo !== bActivo) return aActivo ? -1 : 1;
            
            const nombreA = `${a.nombres || ''} ${a.apellidos || ''}`.trim().toLowerCase();
            const nombreB = `${b.nombres || ''} ${b.apellidos || ''}`.trim().toLowerCase();
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }

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
    arbitros: entityList.items,
    nivelFilter: entityList.state.filters.nivel || 'all',
    estadoFilter: entityList.state.filters.estado || 'all',
  }

  const dispatch = useCallback((action: any) => {
    switch (action.type) {
      case 'SET_GLOBAL_FILTER': return entityList.setGlobalFilter(action.payload)
      case 'SET_NIVEL_FILTER': return entityList.setFilter('nivel', action.payload)
      case 'SET_ESTADO_FILTER': return entityList.setFilter('estado', action.payload)
      case 'TOGGLE_SHOW_FILTERS': return entityList.toggleShowFilters()
      case 'CLEAR_FILTERS': return entityList.clearFilters()
      case 'SET_ARBITROS': return entityList.setItems(action.payload)
    }
  }, [entityList])

  const loadArbitros = entityList.loadItems

  return {
    state,
    dispatch,
    loadArbitros,
    toggleStatus: entityList.toggleStatus,
    updateLocalArbitro: entityList.updateLocalItem,
    deleteLocalArbitro: entityList.deleteLocalItem,
    filteredData,
    entityList
  }
}
