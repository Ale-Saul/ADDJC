import { comunicacionService } from '@/services/comunicacionService'
import {
  createNoticiaSchema,
  updateNoticiaSchema,
  createNotificacionSchema,
  filtroNoticiaSchema,
} from '@/schemas/comunicacionSchema'
import {
  Noticia,
  NoticiaCreate,
  Notificacion,
  NotificacionCreate,
  NotificacionContador,
  ComunicacionAudiencia,
} from '@/models/comunicacion'
import { ApiResponse } from '@/types/globales'

/**
 * Controlador del Módulo de Comunicación.
 * Orquesta servicios y aplica lógica de negocio y validaciones.
 */
export const comunicacionController = {

  // ─── Noticias ──────────────────────────────────────────────────────────────

  async getNoticiasByClub(
    clubId: string,
    filtros?: {
      categoria?: string
      audiencia?: string
      solo_destacadas?: boolean
      solo_activas?: boolean
      fecha_referencia?: string
    }
  ): Promise<ApiResponse<Noticia[]>> {
    try {
      const parsed = filtroNoticiaSchema.safeParse({ club_id: clubId, ...filtros })
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message ?? 'Filtros inválidos' }
      }

      const data = await comunicacionService.getNoticiasByClub(clubId, {
        categoria: parsed.data.categoria,
        audiencia: parsed.data.audiencia,
        solo_destacadas: parsed.data.solo_destacadas,
        solo_activas: parsed.data.solo_activas ?? true,
        fecha_referencia: parsed.data.fecha_referencia,
      })

      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.getNoticiasByClub:', err)
      return { success: false, error: 'Error al obtener las noticias' }
    }
  },

  async getNoticiasParaUsuario(
    usuarioAudiencia: ComunicacionAudiencia,
    clubId?: string
  ): Promise<ApiResponse<Noticia[]>> {
    try {
      const hoy = new Date().toISOString().split('T')[0]

      if (clubId) {
        const data = await comunicacionService.getNoticiasByClub(clubId, {
          audiencia: usuarioAudiencia,
          solo_activas: true,
          fecha_referencia: hoy,
        })
        return { success: true, data }
      }

      // Sin club_id: solo noticias de la Asociación (club_id IS NULL)
      return { success: true, data: [] }
    } catch (err) {
      console.error('Error en comunicacionController.getNoticiasParaUsuario:', err)
      return { success: false, error: 'Error al obtener las noticias' }
    }
  },

  async getNoticiasDestacadas(clubId?: string): Promise<ApiResponse<Noticia[]>> {
    try {
      const data = await comunicacionService.getNoticiasDestacadas(clubId)
      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.getNoticiasDestacadas:', err)
      return { success: false, error: 'Error al obtener noticias destacadas' }
    }
  },

  async getNoticiaById(id: string): Promise<ApiResponse<Noticia>> {
    try {
      if (!id) return { success: false, error: 'ID de noticia requerido' }
      const data = await comunicacionService.getNoticiaById(id)
      if (!data) return { success: false, error: 'Noticia no encontrada' }
      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.getNoticiaById:', err)
      return { success: false, error: 'Error al obtener la noticia' }
    }
  },

  async createNoticia(payload: NoticiaCreate): Promise<ApiResponse<Noticia>> {
    try {
      const parsed = createNoticiaSchema.safeParse(payload)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
      }

      const normalizado: NoticiaCreate = {
        ...parsed.data,
        titulo: parsed.data.titulo.replace(/\s+/g, ' ').trim(),
        contenido: parsed.data.contenido.replace(/\s+/g, ' ').trim(),
        club_id: parsed.data.club_id ?? null,
        imagen_url: parsed.data.imagen_url ?? null,
        fecha_fin: parsed.data.fecha_fin ?? null,
      }

      const data = await comunicacionService.createNoticia(normalizado)
      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.createNoticia:', err)
      return { success: false, error: 'Error al crear la noticia' }
    }
  },

  async updateNoticia(id: string, payload: Partial<NoticiaCreate>): Promise<ApiResponse<Noticia>> {
    try {
      if (!id) return { success: false, error: 'ID de noticia requerido' }

      const parsed = updateNoticiaSchema.safeParse(payload)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
      }

      const data = await comunicacionService.updateNoticia(id, parsed.data)
      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.updateNoticia:', err)
      return { success: false, error: 'Error al actualizar la noticia' }
    }
  },

  async deleteNoticia(id: string): Promise<ApiResponse<void>> {
    try {
      if (!id) return { success: false, error: 'ID de noticia requerido' }
      await comunicacionService.deleteNoticia(id)
      return { success: true }
    } catch (err) {
      console.error('Error en comunicacionController.deleteNoticia:', err)
      return { success: false, error: 'Error al eliminar la noticia' }
    }
  },

  // ─── Notificaciones ────────────────────────────────────────────────────────

  async getNotificacionesByUsuario(usuarioId: string): Promise<ApiResponse<Notificacion[]>> {
    try {
      if (!usuarioId) return { success: false, error: 'ID de usuario requerido' }
      const data = await comunicacionService.getNotificacionesByUsuario(usuarioId)
      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.getNotificacionesByUsuario:', err)
      return { success: false, error: 'Error al obtener notificaciones' }
    }
  },

  async getContadorNoLeidas(usuarioId: string): Promise<ApiResponse<NotificacionContador>> {
    try {
      if (!usuarioId) return { success: false, error: 'ID de usuario requerido' }
      const data = await comunicacionService.getContadorNoLeidas(usuarioId)
      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.getContadorNoLeidas:', err)
      return { success: false, error: 'Error al obtener el contador de notificaciones' }
    }
  },

  async enviarNotificacion(payload: NotificacionCreate): Promise<ApiResponse<Notificacion>> {
    try {
      const parsed = createNotificacionSchema.safeParse(payload)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
      }

      const data = await comunicacionService.createNotificacion({
        ...parsed.data,
        link_accion: parsed.data.link_accion ?? null,
        origen_modulo: parsed.data.origen_modulo ?? null,
        origen_id: parsed.data.origen_id ?? null,
      })

      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.enviarNotificacion:', err)
      return { success: false, error: 'Error al enviar la notificación' }
    }
  },

  async marcarComoLeida(id: string, prioridad: string): Promise<ApiResponse<void>> {
    try {
      if (!id) return { success: false, error: 'ID de notificación requerido' }
      // Las notificaciones de alta prioridad solo las marca el sistema al resolver el origen
      if (prioridad === 'alta') {
        return {
          success: false,
          error: 'Las alertas críticas solo se resuelven completando la acción requerida',
        }
      }
      await comunicacionService.marcarComoLeida(id)
      return { success: true }
    } catch (err) {
      console.error('Error en comunicacionController.marcarComoLeida:', err)
      return { success: false, error: 'Error al marcar la notificación' }
    }
  },

  async marcarTodasLeidas(usuarioId: string): Promise<ApiResponse<void>> {
    try {
      if (!usuarioId) return { success: false, error: 'ID de usuario requerido' }
      await comunicacionService.marcarTodasLeidas(usuarioId)
      return { success: true }
    } catch (err) {
      console.error('Error en comunicacionController.marcarTodasLeidas:', err)
      return { success: false, error: 'Error al marcar las notificaciones' }
    }
  },

  /**
   * Método de integración: envía una notificación de pago desde Tesorería.
   * Se llama automáticamente cuando se detecta una deuda próxima a vencer.
   */
  async notificarPagoPendiente(
    usuarioId: string,
    detalle: { monto: number; vencimiento: string; pagoId: string }
  ): Promise<ApiResponse<Notificacion>> {
    return comunicacionController.enviarNotificacion({
      usuario_id: usuarioId,
      titulo: 'Mensualidad próxima a vencer',
      mensaje: `Tu mensualidad de Bs. ${detalle.monto} vence el ${detalle.vencimiento}. Realiza tu pago a tiempo para evitar recargos.`,
      tipo: 'pago',
      prioridad: 'alta',
      link_accion: '/tesoreria/pagos',
      origen_modulo: 'tesoreria',
      origen_id: detalle.pagoId,
    })
  },

  /**
   * Método de integración: envía una notificación de habilitación para examen de grado.
   */
  async notificarHabilitacionExamen(
    usuarioId: string,
    detalle: { cinturon: string; fecha: string }
  ): Promise<ApiResponse<Notificacion>> {
    return comunicacionController.enviarNotificacion({
      usuario_id: usuarioId,
      titulo: `¡Habilitado para examen de ${detalle.cinturon}!`,
      mensaje: `Felicidades, has sido habilitado para el examen de ${detalle.cinturon} el día ${detalle.fecha}. ¡Prepárate!`,
      tipo: 'examen',
      prioridad: 'alta',
      link_accion: null,
      origen_modulo: 'grados',
      origen_id: null,
    })
  },
}
