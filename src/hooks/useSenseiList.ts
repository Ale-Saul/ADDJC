import { useCallback } from 'react'
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { useEntityList } from './useEntityList'

export function useSenseiList(initialSearch: string = '', refreshTrigger: number = 0, clubId?: string) {
  const filterFn = useCallback((s: Sensei, filters: Record<string, string>, search: string) => {
    const matchGradoDan = filters.gradoDan === 'all' || s.grado_dan === filters.gradoDan
    const matchEspecialidad = filters.especialidad === 'all' || s.especialidad === filters.especialidad
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? s.activo : !s.activo)
    const matchSearch = Boolean(!search ||
      s.nombres?.toLowerCase().includes(search) ||
      s.apellidos?.toLowerCase().includes(search) ||
      s.ci?.toLowerCase().includes(search) ||
      s.grado_dan?.toLowerCase().includes(search) ||
      s.especialidad?.toLowerCase().includes(search))

    return Boolean(matchGradoDan && matchEspecialidad && matchEstado && matchSearch)
  }, [])

  const entityList = useEntityList<Sensei>({
    queryKey: ['senseis', refreshTrigger.toString(), clubId || 'all'],
    fetchItems: async () => {
      if (clubId) {
        const [clubResp, unassignedResp] = await Promise.all([
          senseiController.getSenseisByClub(clubId),
          senseiController.getAllSenseis(true)
        ])

        if (clubResp.success && unassignedResp.success) {
          const clubSenseis = clubResp.data || []
          const unassignedSenseis = (unassignedResp.data || []).filter(s => !s.club_id)
          return {
            success: true,
            data: [...clubSenseis, ...unassignedSenseis]
          }
        }
        return clubResp.success ? clubResp : unassignedResp
      }
      return await senseiController.getAllSenseis(true)
    },
    updateItemStatus: async (id, activo) => {
      const resp = await senseiController.updateSensei(id, { activo })
      return { success: resp.success, error: resp.error }
    },
    filterFn,
    initialFilters: { gradoDan: 'all', especialidad: 'all', estado: 'all' },
    initialSearch
  })

  // Retain the old shape so standard consumers don't break immediately
  const state = {
    ...entityList.state,
    senseis: entityList.items,
    gradoDanFilter: entityList.state.filters.gradoDan || 'all',
    especialidadFilter: entityList.state.filters.especialidad || 'all',
    estadoFilter: entityList.state.filters.estado || 'all',
  }

  const dispatch = useCallback((action: any) => {
    switch (action.type) {
      case 'SET_GLOBAL_FILTER': return entityList.setGlobalFilter(action.payload)
      case 'SET_GRADO_DAN_FILTER': return entityList.setFilter('gradoDan', action.payload)
      case 'SET_ESPECIALIDAD_FILTER': return entityList.setFilter('especialidad', action.payload)
      case 'SET_ESTADO_FILTER': return entityList.setFilter('estado', action.payload)
      case 'TOGGLE_SHOW_FILTERS': return entityList.toggleShowFilters()
      case 'CLEAR_FILTERS': return entityList.clearFilters()
      case 'SET_SENSEIS': return entityList.setItems(action.payload)
    }
  }, [entityList])

  const loadSenseis = entityList.loadItems

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
