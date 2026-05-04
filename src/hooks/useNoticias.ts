'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { comunicacionController } from '@/controllers/comunicacionController'
import { COMUNICACION_QUERY_KEYS } from '@/constants/comunicacion'
import type { NoticiaCreate, ComunicacionAudiencia } from '@/models/comunicacion'

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useNoticiasByClub(
  clubId: string,
  filtros?: {
    categoria?: string
    audiencia?: string
    solo_destacadas?: boolean
  }
) {
  return useQuery({
    queryKey: [...COMUNICACION_QUERY_KEYS.noticiasByClub(clubId), filtros],
    queryFn: () => comunicacionController.getNoticiasByClub(clubId, filtros),
    enabled: !!clubId,
    select: res => res.data ?? [],
  })
}

export function useNoticiasDestacadas(clubId?: string) {
  return useQuery({
    queryKey: COMUNICACION_QUERY_KEYS.noticiasDestacadas(clubId),
    queryFn: () => comunicacionController.getNoticiasDestacadas(clubId),
    select: res => res.data ?? [],
    staleTime: 5 * 60 * 1000, // 5 min — las destacadas no cambian con frecuencia
  })
}

export function useNoticiasParaUsuario(
  audiencia: ComunicacionAudiencia,
  clubId?: string
) {
  return useQuery({
    queryKey: [...COMUNICACION_QUERY_KEYS.noticias(), 'usuario', audiencia, clubId ?? 'none'],
    queryFn: () => comunicacionController.getNoticiasParaUsuario(audiencia, clubId),
    enabled: !!audiencia,
    select: res => res.data ?? [],
  })
}

export function useNoticiaById(id: string) {
  return useQuery({
    queryKey: COMUNICACION_QUERY_KEYS.noticiaById(id),
    queryFn: () => comunicacionController.getNoticiaById(id),
    enabled: !!id,
    select: res => res.data ?? null,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateNoticia(clubId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NoticiaCreate) => comunicacionController.createNoticia(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMUNICACION_QUERY_KEYS.noticias() })
      if (clubId) {
        queryClient.invalidateQueries({
          queryKey: COMUNICACION_QUERY_KEYS.noticiasDestacadas(clubId),
        })
      }
    },
  })
}

export function useUpdateNoticia(noticiaId: string, clubId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<NoticiaCreate>) =>
      comunicacionController.updateNoticia(noticiaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMUNICACION_QUERY_KEYS.noticias() })
      queryClient.invalidateQueries({
        queryKey: COMUNICACION_QUERY_KEYS.noticiaById(noticiaId),
      })
      if (clubId) {
        queryClient.invalidateQueries({
          queryKey: COMUNICACION_QUERY_KEYS.noticiasDestacadas(clubId),
        })
      }
    },
  })
}

export function useDeleteNoticia(clubId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => comunicacionController.deleteNoticia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMUNICACION_QUERY_KEYS.noticias() })
      if (clubId) {
        queryClient.invalidateQueries({
          queryKey: COMUNICACION_QUERY_KEYS.noticiasDestacadas(clubId),
        })
      }
    },
  })
}
