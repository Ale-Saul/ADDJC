import { useCallback } from 'react'
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useEntityList } from './useEntityList'

export function useJudokaList(options: {
  clubId?: string
  entrenadorId?: string
  refreshTrigger?: number
  judokasProp?: Judoka[]
  initialSearch?: string
  singleSenseiMode?: boolean
}) {
  const filterFn = useCallback((j: Judoka, filters: Record<string, string>, search: string) => {
    const normalizedSearch = search.toLowerCase()
    
    const matchCategoria = filters.categoria === 'all' || j.categoria === filters.categoria
    const matchCinturon = filters.cinturon === 'all' || j.cinturon_actual === filters.cinturon
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? j.activo : !j.activo)
    
    const matchSearch = Boolean(!normalizedSearch || 
      j.nombres?.toLowerCase().includes(normalizedSearch) ||
      j.apellidos?.toLowerCase().includes(normalizedSearch) ||
      j.ci?.toLowerCase().includes(normalizedSearch))

    return matchCategoria && matchCinturon && matchEstado && matchSearch
  }, [])

  const entityList = useEntityList<Judoka>({
    queryKey: ['judokas', options.refreshTrigger?.toString() || '0', options.clubId || 'all', options.entrenadorId || 'all'],
    fetchItems: async () => {
      if (options.judokasProp) return { success: true, data: options.judokasProp }
      
      // Si estamos en singleSenseiMode (Judoka viendo a sus compañeros)
      if (options.singleSenseiMode) {
        if (options.entrenadorId) {
          return await judokaController.getJudokasByEntrenador(options.entrenadorId)
        }
        return { success: true, data: [] }
      }

      // Si hay entrenadorId (Sensei), traer solo los judokas a su mando
      if (options.entrenadorId && options.clubId) {
        return await judokaController.getJudokasByEntrenador(options.entrenadorId)
      }

      // Si hay clubId (Encargado), traer judokas del club y judokas sin club
      if (options.clubId) {
        const [clubResp, unassignedResp] = await Promise.all([
          judokaController.getJudokasByClub(options.clubId),
          judokaController.getAllJudokas(true) // Traer todos para filtrar los sin club
        ])

        if (clubResp.success && unassignedResp.success) {
          const clubJudokas = clubResp.data || []
          const unassignedJudokas = (unassignedResp.data || []).filter(j => !j.club_id)
          
          // Combinar ambos (club primero, luego sin club)
          return {
            success: true,
            data: [...clubJudokas, ...unassignedJudokas]
          }
        }
        return clubResp.success ? clubResp : unassignedResp
      }

      if (options.entrenadorId && !options.clubId) {
        return await judokaController.getJudokasByEntrenador(options.entrenadorId)
      }

      return await judokaController.getAllJudokas(true)
    },
    updateItemStatus: async (id, activo) => {
      const resp = await judokaController.updateJudoka(id, { activo })
      return { success: resp.success, error: resp.error }
    },
    filterFn,
    initialFilters: { categoria: 'all', cinturon: 'all', estado: 'all' },
    initialSearch: options.initialSearch || ''
  })

  return {
    judokas: entityList.items,
    loading: entityList.state.loading,
    error: entityList.state.error,
    modifiedIds: entityList.state.modifiedIds,
    loadJudokas: entityList.loadItems,
    toggleStatus: entityList.toggleStatus,
    updateLocalJudoka: entityList.updateLocalItem,
    deleteLocalJudoka: entityList.deleteLocalItem,
    filteredData: entityList.filteredData,
    state: {
      ...entityList.state,
      categoriaFilter: entityList.state.filters.categoria || 'all',
      cinturonFilter: entityList.state.filters.cinturon || 'all',
      estadoFilter: entityList.state.filters.estado || 'all',
    },
    setGlobalFilter: entityList.setGlobalFilter,
    setFilter: entityList.setFilter,
    toggleShowFilters: entityList.toggleShowFilters
  }
}






