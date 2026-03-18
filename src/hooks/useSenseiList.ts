import { useCallback } from 'react'
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { useEntityList } from './useEntityList'

export function useSenseiList(initialSearch: string = '') {
  const filterFn = useCallback((s: Sensei, filters: Record<string, string>, search: string) => {
    const matchEspecialidad = filters.especialidad === 'all' || s.especialidad === filters.especialidad
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? s.activo : !s.activo)
    const matchSearch = Boolean(!search ||
      s.nombres?.toLowerCase().includes(search) ||
      s.apellidos?.toLowerCase().includes(search) ||
      s.ci?.toLowerCase().includes(search) ||
      s.grado_dan?.toLowerCase().includes(search) ||
      s.especialidad?.toLowerCase().includes(search))

    return Boolean(matchEspecialidad && matchEstado && matchSearch)
  }, [])

  const entityList = useEntityList<Sensei>({
    queryKey: ['senseis'],
    fetchItems: async () => await senseiController.getAllSenseis(true),
    updateItemStatus: async (id, activo) => {
      const resp = await senseiController.updateSensei(id, { activo })
      return { success: resp.success, error: resp.error }
    },
    filterFn,
    initialFilters: { especialidad: 'all', estado: 'all' },
    initialSearch
  })

  // Retain the old shape so standard consumers don't break immediately
  const state = {
    ...entityList.state,
    senseis: entityList.items,
    especialidadFilter: entityList.state.filters.especialidad || 'all',
    estadoFilter: entityList.state.filters.estado || 'all',
  }

  const dispatch = useCallback((action: any) => {
    switch (action.type) {
      case 'SET_GLOBAL_FILTER': return entityList.setGlobalFilter(action.payload)
      case 'SET_ESPECIALIDAD_FILTER': return entityList.setFilter('especialidad', action.payload)
      case 'SET_ESTADO_FILTER': return entityList.setFilter('estado', action.payload)
      case 'TOGGLE_SHOW_FILTERS': return entityList.toggleShowFilters()
      case 'CLEAR_FILTERS': return entityList.clearFilters()
      case 'SET_SENSEIS': return entityList.setItems(action.payload)
    }
  }, [entityList])

  const loadSenseis = useCallback(async () => {
    await entityList.loadItems()
  }, [entityList])

  return {
    state,
    dispatch,
    loadSenseis,
    toggleStatus: entityList.toggleStatus,
    updateLocalSensei: entityList.updateLocalItem,
    deleteLocalSensei: entityList.deleteLocalItem,
    filteredData: entityList.filteredData,
    entityList
  }
}
