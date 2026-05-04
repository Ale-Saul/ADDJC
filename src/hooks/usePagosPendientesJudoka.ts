'use client'

import { useQuery } from '@tanstack/react-query'
import { pagoController } from '@/controllers/pagoController'

export const PAGOS_JUDOKA_QUERY_KEYS = {
  all: ['pagos-judoka'] as const,
  pendientes: (usuarioId: string) => [...PAGOS_JUDOKA_QUERY_KEYS.all, 'pendientes', usuarioId] as const,
} as const

export function usePagosPendientesJudoka(usuarioId?: string) {
  return useQuery({
    queryKey: PAGOS_JUDOKA_QUERY_KEYS.pendientes(usuarioId ?? ''),
    queryFn: () => pagoController.getPagosPendientesByUsuario(usuarioId ?? ''),
    enabled: !!usuarioId,
    select: res => res.data ?? [],
  })
}
