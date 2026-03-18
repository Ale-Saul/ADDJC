import { useCallback } from 'react'
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
import { useEntityList } from './useEntityList'

export function useArbitroList(initialSearch: string = '') {
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
    queryKey: ['arbitros'],
    fetchItems: async () => await arbitroController.getAllArbitros(true),
    updateItemStatus: async (id, activo) => {
      const resp = await arbitroController.updateArbitro(id, { activo })
      return { success: resp.success, error: resp.error }
    },
    filterFn,
    initialFilters: { nivel: 'all', estado: 'all' },
    initialSearch
  })

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

  const loadArbitros = useCallback(async () => {
    await entityList.loadItems()
  }, [entityList])

  return {
    state,
    dispatch,
    loadArbitros,
    toggleStatus: entityList.toggleStatus,
    updateLocalArbitro: entityList.updateLocalItem,
    deleteLocalArbitro: entityList.deleteLocalItem,
    filteredData: entityList.filteredData,
    entityList
  }
}
