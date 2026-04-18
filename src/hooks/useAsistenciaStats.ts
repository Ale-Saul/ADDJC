import { useQuery } from '@tanstack/react-query'
import { asistenciaController } from '@/controllers/asistenciaController'
import { ASISTENCIA_QUERY_KEYS } from '@/constants/asistencia'

/**
 * Estadísticas de asistencia del propio judoka.
 * Uso: vista "Mi Asistencia" (rol judoka) y consulta de asociación.
 */
export function useStatsJudoka(
  judokaId: string,
  filtros?: { fecha_inicio?: string; fecha_fin?: string }
) {
  return useQuery({
    queryKey: [...ASISTENCIA_QUERY_KEYS.statsJudoka(judokaId), filtros],
    queryFn: async () => {
      const res = await asistenciaController.getStatsJudoka(judokaId, filtros)
      if (!res.success) throw new Error(res.error || 'Error al obtener estadísticas del judoka')
      return res.data
    },
    enabled: !!judokaId,
  })
}

/**
 * Estadísticas de asistencia agrupadas por estudiante para un sensei.
 * Uso: dashboard de sensei.
 */
export function useStatsBySensei(
  senseiId: string,
  filtros?: { fecha_inicio?: string; fecha_fin?: string }
) {
  return useQuery({
    queryKey: [...ASISTENCIA_QUERY_KEYS.statsSensei(senseiId), filtros],
    queryFn: async () => {
      const res = await asistenciaController.getStatsBySensei(senseiId, filtros)
      if (!res.success) throw new Error(res.error || 'Error al obtener estadísticas del sensei')
      return res.data ?? []
    },
    enabled: !!senseiId,
  })
}

/**
 * Reporte global del club con filtro de fechas obligatorio.
 * Uso: dashboard de encargado.
 */
export function useReporteClub(
  clubId: string,
  filtros: { fecha_inicio: string; fecha_fin: string }
) {
  return useQuery({
    queryKey: [...ASISTENCIA_QUERY_KEYS.reporteClub(clubId), filtros],
    queryFn: async () => {
      const res = await asistenciaController.getReporteClub(clubId, filtros)
      if (!res.success) throw new Error(res.error || 'Error al obtener el reporte del club')
      return res.data
    },
    enabled: !!clubId && !!filtros.fecha_inicio && !!filtros.fecha_fin,
  })
}
