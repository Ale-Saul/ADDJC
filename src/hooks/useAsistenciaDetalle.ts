import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { asistenciaController } from '@/controllers/asistenciaController'
import { AsistenciaDetalleUpsert } from '@/models/asistencia'
import { ASISTENCIA_QUERY_KEYS } from '@/constants/asistencia'

/**
 * Obtiene la lista de asistencia (detalle) de una sesión.
 * Uso: sensei/encargado al abrir el formulario de tomar lista.
 */
export function useDetalleSesion(sesionId: string) {
  return useQuery({
    queryKey: ASISTENCIA_QUERY_KEYS.detalle(sesionId),
    queryFn: async () => {
      const res = await asistenciaController.getAsistenciasBySesion(sesionId)
      if (!res.success) throw new Error(res.error || 'Error al obtener la lista de asistencia')
      return res.data ?? []
    },
    enabled: !!sesionId,
  })
}

/**
 * Guarda o actualiza la asistencia masiva de una sesión (tomar lista).
 * Invalida el detalle de la sesión y las stats del sensei y del club
 * para que los dashboards reflejen el cambio sin recargar la página.
 */
export function useRegistrarAsistencia(senseiId?: string, clubId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sesionId, asistencias }: { sesionId: string; asistencias: AsistenciaDetalleUpsert[] }) =>
      asistenciaController.registrarAsistenciaMasiva(sesionId, asistencias),
    onSuccess: (res, variables) => {
      if (!res.success) return
      // Invalida el detalle de la sesión recién guardada
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.detalle(variables.sesionId) })
      // Invalida estadísticas derivadas para que reflejen el cambio
      if (senseiId) {
        queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.statsSensei(senseiId) })
      }
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.reporteClub(clubId) })
      }
    },
  })
}

/**
 * Obtiene el historial de asistencia de un judoka con filtro de fechas.
 * Uso: judoka (mi asistencia) y asociación (consulta por judoka).
 */
export function useHistorialJudoka(
  judokaId: string,
  filtros?: { fecha_inicio?: string; fecha_fin?: string }
) {
  return useQuery({
    queryKey: [...ASISTENCIA_QUERY_KEYS.historial(judokaId), filtros],
    queryFn: async () => {
      const res = await asistenciaController.getHistorialJudoka(judokaId, filtros)
      if (!res.success) throw new Error(res.error || 'Error al obtener el historial del judoka')
      return res.data ?? []
    },
    enabled: !!judokaId,
  })
}
