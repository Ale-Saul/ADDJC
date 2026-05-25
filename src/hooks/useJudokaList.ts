import { useCallback, useState, useEffect, useMemo } from 'react'
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

import { useEntityList } from './useEntityList'

export function useJudokaList(options: {
  clubId?: string
  entrenadorId?: string
  refreshTrigger?: number
  judokasProp?: Judoka[]
  initialSearch?: string
  singleSenseiMode?: boolean
}) {
  const [initialOrder, setInitialOrder] = useState<string[] | null>(null)
  const { user } = useAuth()

  const filterFn = useCallback((j: Judoka, filters: Record<string, string>, search: string) => {
    const normalizedSearch = search.toLowerCase()
    
    const matchCategoria = filters.categoria === 'all' || j.categoria === filters.categoria
    const matchCinturon = filters.cinturon === 'all' || j.cinturon_actual === filters.cinturon
    
    // El filtro de estado solo actúa si el usuario lo selecciona explícitamente en el dropdown.
    // No filtramos por estado automáticamente para evitar que las filas desaparezcan o salten al desactivarlas.
    const matchEstado = filters.estado === 'all' || (filters.estado === 'activo' ? j.activo : !j.activo)
    
    const matchSearch = Boolean(!normalizedSearch || 
      j.nombres?.toLowerCase().includes(normalizedSearch) ||
      j.apellidos?.toLowerCase().includes(normalizedSearch) ||
      j.ci?.toLowerCase().includes(normalizedSearch))

    return Boolean(matchCategoria && matchCinturon && matchEstado && matchSearch)
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
      const resp = await judokaController.updateJudoka(id, { 
        activo, 
        updated_by: user?.id 
      })
      // Aseguramos que devolvemos el objeto judoka completo con el nombre del editor resuelto
      return { success: resp.success, error: resp.error, data: resp.data }
    },
    filterFn,
    initialFilters: { categoria: 'all', cinturon: 'all', estado: 'all' },
    initialSearch: options.initialSearch || '',
    enabled: !!user || !!options.judokasProp
  })

  // Estabilizar el orden inicial para evitar saltos al cambiar el estado
  useEffect(() => {
    // Solo capturamos el orden si tenemos items y NO tenemos un orden previo.
    // Una vez capturado, no se toca hasta que la página se reinicie o cambie el club/entrenador.
    if (entityList.items.length > 0 && initialOrder === null) {
      const sortedIds = [...entityList.items]
        .sort((a, b) => {
          // 1. Prioridad por estado (activos primero)
          const aActivo = a.activo ?? true;
          const bActivo = b.activo ?? true;
          if (aActivo !== bActivo) return aActivo ? -1 : 1;
          
          // 2. Prioridad por pertenencia a club (los que tienen club van primero)
          const aHasClub = !!a.club_id;
          const bHasClub = !!b.club_id;
          if (aHasClub !== bHasClub) return aHasClub ? -1 : 1;

          // 3. Orden alfabético por nombre completo
          const nombreA = `${a.nombres || ''} ${a.apellidos || ''}`.trim().toLowerCase();
          const nombreB = `${b.nombres || ''} ${b.apellidos || ''}`.trim().toLowerCase();
          return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        })
        .map(item => item.id);
      setInitialOrder(sortedIds);
    }
  }, [entityList.items, initialOrder]);

  // Si los datos desaparecen por completo, permitimos recalcular el orden en la siguiente carga
  useEffect(() => {
    if (entityList.items.length === 0 && !options.judokasProp) {
      setInitialOrder(null);
    }
  }, [entityList.items.length, options.judokasProp]);

  // Obtener data con orden diferido (basado en el orden capturado al cargar)
  const filteredData = useMemo(() => {
    if (!initialOrder) {
      return [...entityList.filteredData].sort((a, b) => {
        const aActivo = a.activo ?? true;
        const bActivo = b.activo ?? true;
        if (aActivo !== bActivo) return aActivo ? -1 : 1;
        
        const aHasClub = !!a.club_id;
        const bHasClub = !!b.club_id;
        if (aHasClub !== bHasClub) return aHasClub ? -1 : 1;

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

  return {
    judokas: entityList.items,
    loading: entityList.state.loading,
    error: entityList.state.error,
    modifiedIds: entityList.state.modifiedIds,
    loadJudokas: entityList.loadItems,
    toggleStatus: entityList.toggleStatus,
    updateLocalJudoka: entityList.updateLocalItem,
    deleteLocalJudoka: entityList.deleteLocalItem,
    filteredData,
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






