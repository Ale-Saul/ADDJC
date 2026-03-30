import { useCallback } from 'react'
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import { useEntityList } from './useEntityList'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

export function useClubList(initialSearch: string = '', refreshTrigger: number = 0) {
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
    initialSearch
  })

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
    filteredData: entityList.filteredData,
    entityList
  }
}
