import { useCallback, useState, useEffect, useMemo } from 'react'
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { useEntityList } from './useEntityList'

export function useSenseiList(initialSearch: string = '', refreshTrigger: number = 0, clubId?: string) {
  const [initialOrder, setInitialOrder] = useState<string[] | null>(null)

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

  // Estabilizar el orden inicial para evitar saltos al cambiar el estado
  useEffect(() => {
    if (entityList.items.length > 0 && !initialOrder) {
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
    filteredData,
    entityList
  }
}
