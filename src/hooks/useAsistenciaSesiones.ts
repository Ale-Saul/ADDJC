import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { asistenciaController } from '@/controllers/asistenciaController'
import { 
  AsistenciaSesionCreate, 
  AsistenciaSesionUpdate 
} from '@/models/asistencia'
import { ASISTENCIA_QUERY_KEYS } from '@/constants/asistencia'

/**
 * Obtiene las sesiones de asistencia de un club.
 * Uso: Encargado
 */
export function useSesionesByClub(clubId: string) {
  return useQuery({
    queryKey: ASISTENCIA_QUERY_KEYS.sesionesClub(clubId),
    queryFn: async () => {
      const res = await asistenciaController.getSesionesByClub(clubId)
      if (!res.success) throw new Error(res.error || 'Error al obtener sesiones del club')
      return res.data ?? []
    },
    enabled: !!clubId,
  })
}

/**
 * Obtiene las sesiones de asistencia de un sensei.
 * Uso: Sensei (sus propias clases)
 */
export function useSesionesBySensei(senseiId: string) {
  return useQuery({
    queryKey: ASISTENCIA_QUERY_KEYS.esionesSensei(senseiId),
    queryFn: async () => {
      const res = await asistenciaController.getSesionesBySensei(senseiId)
      if (!res.success) throw new Error(res.error || 'Error al obtener sesiones del sensei')
      return res.data ?? []
    },
    enabled: !!senseiId,
  })
}

/**
 * Obtiene el detalle completo de una sesión específica.
 */
export function useSesionById(sesionId: string) {
  return useQuery({
    queryKey: ASISTENCIA_QUERY_KEYS.sesion(sesionId),
    queryFn: async () => {
      const res = await asistenciaController.getSesionById(sesionId)
      if (!res.success) throw new Error(res.error || 'Error al obtener la sesión')
      return res.data
    },
    enabled: !!sesionId,
  })
}

/**
 * Crea una nueva sesión de asistencia.
 * Invalida automáticamente la caché del club y del sensei.
 */
export function useCrearSesion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AsistenciaSesionCreate) => asistenciaController.createSesion(data),
    onSuccess: (res, variables) => {
      if (!res.success) return
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.sesionesClub(variables.club_id) })
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.esionesSensei(variables.sensei_id) })
    },
  })
}

/**
 * Actualiza los metadatos de una sesión.
 * Invalida la sesión afectada y las listas relacionadas.
 */
export function useActualizarSesion(clubId: string, senseiId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AsistenciaSesionUpdate }) =>
      asistenciaController.updateSesion(id, data),
    onSuccess: (res, variables) => {
      if (!res.success) return
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.sesion(variables.id) })
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.sesionesClub(clubId) })
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.esionesSensei(senseiId) })
    },
  })
}

/**
 * Elimina lógicamente una sesión.
 * Invalida la caché del club y del sensei tras el borrado.
 */
export function useEliminarSesion(clubId: string, senseiId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId?: string }) =>
      asistenciaController.deleteSesion(id, userId),
    onSuccess: (res, variables) => {
      if (!res.success) return
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.sesionesClub(clubId) })
      queryClient.invalidateQueries({ queryKey: ASISTENCIA_QUERY_KEYS.esionesSensei(senseiId) })
      queryClient.removeQueries({ queryKey: ASISTENCIA_QUERY_KEYS.sesion(variables.id) })
    },
  })
}
