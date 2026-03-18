import { useCallback } from 'react'
import { MiembroAsociacion } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import { useEntityList } from './useEntityList'

export function useMiembroAsociacionList(initialSearch: string = '') {
  const filterFn = useCallback((m: MiembroAsociacion, filters: Record<string, string>, search: string) => {
    const matchCargo = filters.cargo === 'all' || m.cargo === filters.cargo
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? m.activo : !m.activo)
    const normalizedSearch = search.toLowerCase()
    const matchSearch = Boolean(!normalizedSearch || 
      m.nombres?.toLowerCase().includes(normalizedSearch) ||
      m.apellidos?.toLowerCase().includes(normalizedSearch) ||
      m.ci?.toLowerCase().includes(normalizedSearch) ||
      m.cargo?.toLowerCase().includes(normalizedSearch))

    return Boolean(matchCargo && matchEstado && matchSearch)
  }, [])

  const entityList = useEntityList<MiembroAsociacion>({
    queryKey: ['miembros-asociacion'],
    fetchItems: async () => await asociacionController.getAllMiembros(true),
    updateItemStatus: async (id, activo) => {
      const resp = await asociacionController.updateMiembro(id, { activo } as any)
      return { success: resp.success, error: resp.error }
    },
    filterFn,
    initialFilters: { cargo: 'all', estado: 'all' },
    initialSearch
  })

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

  const loadMiembros = useCallback(async () => {
    await entityList.loadItems()
  }, [entityList])

  return {
    state,
    dispatch,
    loadMiembros,
    toggleStatus: entityList.toggleStatus,
    updateLocalMiembro: entityList.updateLocalItem,
    deleteLocalMiembro: entityList.deleteLocalItem,
    filteredData: entityList.filteredData,
    entityList
  }
}
