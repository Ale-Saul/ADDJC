import { useCallback } from 'react'
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useJudokaList(options: {
  clubId?: string
  entrenadorId?: string
  refreshTrigger?: number
  judokasProp?: Judoka[]
}) {
  const queryClient = useQueryClient()

  // 1. Fetching con React Query
  const { 
    data: judokas = [], 
    isLoading: loading, 
    error: queryError 
  } = useQuery({
    queryKey: ['judokas', options.refreshTrigger],
    queryFn: async () => {
      // Si recibimos datos duros (como en páginas de perfil), no hacemos fetch al controlador.
      // Ojo: Si judokasProp existe, esto se manejará con el initialData del query, o un bypass.
      if (options.judokasProp) return options.judokasProp

      const response = await judokaController.getAllJudokas(true)
      if (!response.success) throw new Error(response.error || 'Error al cargar los judokas')
      return response.data || []
    },
    // Si proveemos judokasProp, inicializamos el cache con esos datos y no hacemos fetch
    initialData: options.judokasProp,
    staleTime: 5 * 60 * 1000, 
  })

  // Para compatibilidad con el error local que la vista pueda leer:
  const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null)

  // 2. Mutations para modificar estado
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string, currentStatus: boolean }) => {
      const response = await judokaController.updateJudoka(id, { activo: !currentStatus })
      if (!response.success) throw new Error(response.error || 'Error desconocido')
      return { id, isActive: !currentStatus }
    },
    // Optimistic Update
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['judokas'] })
      const previousJudokas = queryClient.getQueryData<Judoka[]>(['judokas']) || []
      
      queryClient.setQueryData<Judoka[]>(['judokas'], old => {
        if (!old) return old
        return old.map(j => j.id === id ? { ...j, activo: !currentStatus } : j)
      })

      return { previousJudokas }
    },
    onError: (err, { id, currentStatus }, context) => {
      if (context?.previousJudokas) {
        queryClient.setQueryData(['judokas'], context.previousJudokas)
      }
      alert('Error al cambiar el estado: ' + err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['judokas'] })
    }
  })

  const toggleStatus = useCallback((id: string, currentStatus: boolean) => {
    return toggleStatusMutation.mutateAsync({ id, currentStatus })
  }, [toggleStatusMutation])

  const updateLocalJudoka = useCallback((id: string, data: Partial<Judoka>) => {
    queryClient.setQueryData<Judoka[]>(['judokas'], old => {
      if (!old) return old
      return old.map(j => j.id === id ? { ...j, ...data } : j)
    })
  }, [queryClient])

  const deleteLocalJudoka = useCallback((id: string) => {
    queryClient.setQueryData<Judoka[]>(['judokas'], old => {
      if (!old) return old
      return old.filter(j => j.id !== id)
    })
  }, [queryClient])

  // Fake modifiedIds array set just for backward compat since we do optimistic UI.
  const modifiedIds = new Set<string>()

  // loadJudokas dummy para compatibilidad si alguien lo llama manualmente
  const loadJudokas = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['judokas'] })
  }, [queryClient])

  return {
    judokas,
    loading,
    error,
    modifiedIds,
    loadJudokas,
    toggleStatus,
    updateLocalJudoka,
    deleteLocalJudoka
  }
}
