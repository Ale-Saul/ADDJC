'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { comunicacionController } from '@/controllers/comunicacionController'
import { COMUNICACION_QUERY_KEYS } from '@/constants/comunicacion'
import type { NotificacionCreate } from '@/models/comunicacion'

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useNotificacionesByUsuario(usuarioId: string) {
  return useQuery({
    queryKey: COMUNICACION_QUERY_KEYS.notificacionesByUsuario(usuarioId),
    queryFn: () => comunicacionController.getNotificacionesByUsuario(usuarioId),
    enabled: !!usuarioId,
    select: res => res.data ?? [],
  })
}

/**
 * Hook ligero para el contador de la campana.
 * Se refresca cada 30 segundos para mantener el badge actualizado.
 */
export function useContadorNotificaciones(usuarioId: string) {
  return useQuery({
    queryKey: COMUNICACION_QUERY_KEYS.notificacionesContador(usuarioId),
    queryFn: () => comunicacionController.getContadorNoLeidas(usuarioId),
    enabled: !!usuarioId,
    select: res => res.data ?? { total_no_leidas: 0, tiene_alta_prioridad: false },
    refetchInterval: 30_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMarcarComoLeida(usuarioId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, prioridad }: { id: string; prioridad: string }) =>
      comunicacionController.marcarComoLeida(id, prioridad),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.notificacionesByUsuario(usuarioId),
      })
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.notificacionesContador(usuarioId),
      })
    },
  })
}

export function useMarcarTodasLeidas(usuarioId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => comunicacionController.marcarTodasLeidas(usuarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.notificaciones(),
      })
    },
  })
}

export function useEnviarNotificacion(destinatarioId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NotificacionCreate) =>
      comunicacionController.enviarNotificacion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.notificacionesByUsuario(destinatarioId),
      })
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.notificacionesContador(destinatarioId),
      })
    },
  })
}
