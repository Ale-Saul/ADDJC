import { useReducer, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type BaseEntity = {
  id: string
  activo?: boolean
  [key: string]: any
}

type State = {
  globalFilter: string
  filters: Record<string, string>
  showFilters: boolean
}

type Action =
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_FILTER'; key: string; value: string }
  | { type: 'TOGGLE_SHOW_FILTERS' }
  | { type: 'CLEAR_FILTERS'; initialSearch: string; initialFilters: Record<string, string> }

function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GLOBAL_FILTER': return { ...state, globalFilter: action.payload }
    case 'SET_FILTER': return { ...state, filters: { ...state.filters, [action.key]: action.value } }
    case 'TOGGLE_SHOW_FILTERS': return { ...state, showFilters: !state.showFilters }
    case 'CLEAR_FILTERS': return {
      ...state,
      filters: action.initialFilters,
      globalFilter: action.initialSearch
    }
    default: return state
  }
}

export interface UseEntityListOptions<T> {
  queryKey: string[]
  fetchItems: () => Promise<{ success: boolean; data?: T[]; error?: string }>
  updateItemStatus?: (id: string, activo: boolean) => Promise<{ success: boolean; error?: string }>
  filterFn: (item: T, filters: Record<string, string>, globalSearch: string) => boolean
  initialFilters?: Record<string, string>
  initialSearch?: string
}

export function useEntityList<T extends BaseEntity>({
  queryKey,
  fetchItems,
  updateItemStatus,
  filterFn,
  initialFilters = {},
  initialSearch = ''
}: UseEntityListOptions<T>) {
  const queryClient = useQueryClient()
  
  const [state, dispatch] = useReducer(stateReducer, {
    globalFilter: initialSearch,
    filters: initialFilters,
    showFilters: false
  })

  const { data: items = [], isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetchItems()
      if (!response.success) throw new Error(response.error || 'Error al cargar los datos')
      return (response.data || []) as T[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const error = queryError ? (queryError instanceof Error ? queryError.message : String(queryError)) : null

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      if (!updateItemStatus) throw new Error('No status update function provided')
      const response = await updateItemStatus(id, isActive)
      if (!response.success) throw new Error(response.error || 'Error desconocido')
      return { id, isActive }
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousItems = queryClient.getQueryData<T[]>(queryKey) || []
      
      queryClient.setQueryData<T[]>(queryKey, old => {
        if (!old) return old
        return old.map(item => item.id === id ? { ...item, activo: isActive } : item)
      })

      return { previousItems }
    },
    onError: (err, { id }, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems)
      }
      alert('Error al cambiar el estado: ' + err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  // Aliases for compatibility
  const modifiedIds = new Set<string>()

  const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    return toggleStatusMutation.mutateAsync({ id, isActive: !currentStatus })
  }, [toggleStatusMutation])

  const setFilter = useCallback((key: string, value: string) => {
    dispatch({ type: 'SET_FILTER', key, value })
  }, [])

  const setGlobalFilter = useCallback((value: string) => {
    dispatch({ type: 'SET_GLOBAL_FILTER', payload: value })
  }, [])

  const toggleShowFilters = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHOW_FILTERS' })
  }, [])

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS', initialSearch, initialFilters })
  }, [initialSearch, initialFilters])

  const updateLocalItem = useCallback((id: string, data: Partial<T>) => {
    queryClient.setQueryData<T[]>(queryKey, old => {
      if (!old) return old
      return old.map(item => item.id === id ? { ...item, ...data } : item)
    })
  }, [queryClient, queryKey])

  const deleteLocalItem = useCallback((id: string) => {
    queryClient.setQueryData<T[]>(queryKey, old => {
      if (!old) return old
      return old.filter(item => item.id !== id)
    })
  }, [queryClient, queryKey])

  const loadItems = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  const filteredData = useMemo(() => {
    const filtered = items.filter(item => filterFn(item, state.filters, state.globalFilter.toLowerCase()))
    return [...filtered].sort((a, b) => {
      const aActive = a.activo ?? true
      const bActive = b.activo ?? true
      if (aActive === bActive) return 0
      return aActive ? -1 : 1
    })
  }, [items, state.filters, state.globalFilter, filterFn])

  return {
    state: {
      ...state,
      loading,
      error,
      items,
      modifiedIds
    },
    items,
    setItems: (newItems: T[]) => queryClient.setQueryData(queryKey, newItems),
    loadItems,
    toggleStatus,
    updateLocalItem,
    deleteLocalItem,
    filteredData,
    setFilter,
    setGlobalFilter,
    toggleShowFilters,
    clearFilters,
  }
}
