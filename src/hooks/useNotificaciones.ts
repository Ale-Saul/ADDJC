'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { comunicacionController } from '@/controllers/comunicacionController'
import { COMUNICACION_QUERY_KEYS } from '@/constants/comunicacion'
import { ROL } from '@/constants/roles'
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

export function useDestinatariosNotificacion(
  remitenteRol?: string,
  remitenteClubId?: string | null,
  search?: string
) {
  const puedeBuscar = remitenteRol === ROL.ASOCIACION || remitenteRol === ROL.ENCARGADO

  return useQuery({
    queryKey: COMUNICACION_QUERY_KEYS.notificacionesDestinatarios(
      remitenteRol ?? '',
      remitenteClubId,
      search
    ),
    queryFn: () =>
      comunicacionController.getDestinatariosNotificacion(
        remitenteRol ?? '',
        remitenteClubId,
        search
      ),
    enabled: puedeBuscar && (remitenteRol !== ROL.ENCARGADO || !!remitenteClubId),
    select: res => res.data ?? [],
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

export function useEnviarNotificacionManual(usuarioId: string, destinatarioId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      remitente_id: string
      remitente_rol: string
      remitente_club_id?: string | null
      destinatario_id: string
      titulo: string
      mensaje: string
    }) => comunicacionController.enviarNotificacionManual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.notificacionesByUsuario(usuarioId),
      })
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.notificacionesContador(usuarioId),
      })
      if (destinatarioId) {
        queryClient.invalidateQueries({
          queryKey: COMUNICACION_QUERY_KEYS.notificacionesByUsuario(destinatarioId),
        })
        queryClient.invalidateQueries({
          queryKey: COMUNICACION_QUERY_KEYS.notificacionesContador(destinatarioId),
        })
      }
    },
  })
}
