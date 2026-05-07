import { comunicacionService } from '@/services/comunicacionService'
import { createClient } from '@/lib/supabase/client'
import {
  createNoticiaSchema,
  updateNoticiaSchema,
  createNotificacionSchema,
  enviarNotificacionManualSchema,
  filtroNoticiaSchema,
} from '@/schemas/comunicacionSchema'
import {
  Noticia,
  NoticiaCreate,
  Notificacion,
  NotificacionCreate,
  NotificacionContador,
  NotificacionDestinatario,
  ComunicacionAudiencia,
  ComunicacionCategoria,
} from '@/models/comunicacion'
import { ApiResponse } from '@/types/globales'
import { ROL } from '@/constants/roles'

type NoticiaControllerRow = {
  id: string
  club_id: string | null
  autor_id: string
  titulo: string
  contenido: string
  categoria: ComunicacionCategoria
  imagen_url: string | null
  es_destacada: boolean
  audiencia: ComunicacionAudiencia[]
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  created_at: string
  updated_at: string
  usuarios: { nombre?: string | null; apellido_paterno?: string | null } | null
  clubes: { nombre_club?: string | null } | null
}

function mapNoticiaControllerRow(row: NoticiaControllerRow): Noticia {
  return {
    id: row.id,
    club_id: row.club_id,
    autor_id: row.autor_id,
    titulo: row.titulo,
    contenido: row.contenido,
    categoria: row.categoria,
    imagen_url: row.imagen_url,
    es_destacada: row.es_destacada,
    audiencia: row.audiencia,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    activo: row.activo,
    created_at: row.created_at,
    updated_at: row.updated_at,
    nombre_autor: row.usuarios
      ? [row.usuarios.nombre, row.usuarios.apellido_paterno].filter(Boolean).join(' ')
      : undefined,
    nombre_club: row.clubes?.nombre_club ?? null,
  }
}

/** Audiencia efectiva del usuario en el feed (coincide con filtrado en servicio + refuerzo JS). */
function noticiaVisibleParaAudienciaUsuario(
  n: Noticia,
  usuarioAudiencia: ComunicacionAudiencia,
): boolean {
  if (n.audiencia.includes('todos')) return true
  if (usuarioAudiencia === 'senseis' || usuarioAudiencia === 'encargados') {
    return n.audiencia.includes('senseis') || n.audiencia.includes('encargados')
  }
  return n.audiencia.includes(usuarioAudiencia)
}

const SELECT_NOTICIA_BASE = `
  id,
  club_id,
  autor_id,
  titulo,
  contenido,
  categoria,
  imagen_url,
  es_destacada,
  audiencia,
  fecha_inicio,
  fecha_fin,
  activo,
  created_at,
  updated_at,
  usuarios:autor_id(nombre, apellido_paterno),
  clubes:club_id(nombre_club)
`

/**
 * Controlador del Módulo de Comunicación.
 * Orquesta servicios y aplica lógica de negocio y validaciones.
 */
export const comunicacionController = {

  // ─── Noticias ──────────────────────────────────────────────────────────────

  async getNoticiasByClub(
    clubId: string,
    filtros?: {
      categoria?: ComunicacionCategoria
      audiencia?: ComunicacionAudiencia
      solo_destacadas?: boolean
      solo_activas?: boolean
      fecha_referencia?: string
    }
  ): Promise<ApiResponse<Noticia[]>> {
    try {
      // Si el clubId es 'global', no validamos como UUID
      if (clubId !== 'global') {
        const parsed = filtroNoticiaSchema.safeParse({ club_id: clubId, ...filtros })
        if (!parsed.success) {
          return { success: false, error: parsed.error.issues[0]?.message ?? 'Filtros inválidos' }
        }
      }

      const data = await comunicacionService.getNoticiasByClub(clubId, {
        categoria: filtros?.categoria,
        audiencia: filtros?.audiencia,
        solo_destacadas: filtros?.solo_destacadas,
        solo_activas: filtros?.solo_activas ?? true,
        fecha_referencia: filtros?.fecha_referencia,
      })

      // Si es el panel de administración (solo_activas: false),
      // filtramos para que los encargados solo vean sus propias globales
      if (filtros?.solo_activas === false && clubId === 'global') {
        // Este filtro se aplicará en el componente AdminComunicacionPage
      }

      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.getNoticiasByClub:', err)
      return { success: false, error: 'Error al obtener las noticias' }
    }
  },

  async getNoticiasParaUsuario(
    usuarioAudiencia: ComunicacionAudiencia,
    clubId?: string,
    rol?: string
  ): Promise<ApiResponse<Noticia[]>> {
    try {
      const hoy = new Date().toISOString().split('T')[0]

      /** Árbitros y asociación no deben ver noticias ligadas a un club (p. ej. “Para mi club”). */
      const soloFeedGlobal = rol === ROL.ASOCIACION || rol === ROL.ARBITRO

      if (soloFeedGlobal) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('comunicacion_noticias')
          .select(SELECT_NOTICIA_BASE)
          .is('club_id', null)
          .eq('activo', true)
          .lte('fecha_inicio', hoy)
          .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)
          .order('created_at', { ascending: false })

        if (error) throw error

        const mappedData = (data ?? []).map(row =>
          mapNoticiaControllerRow(row as unknown as NoticiaControllerRow)
        )

        // Asociación: todas las globales (ámbito institucional). Árbitro: respeta audiencia.
        if (rol === ROL.ASOCIACION) {
          return { success: true, data: mappedData }
        }

        const filtered = mappedData.filter(n => noticiaVisibleParaAudienciaUsuario(n, usuarioAudiencia))
        return { success: true, data: filtered }
      }

      if (clubId) {
        const data = await comunicacionService.getNoticiasByClub(clubId, {
          audiencia: usuarioAudiencia,
          solo_activas: true,
          fecha_referencia: hoy,
        })

        const filtered = data.filter(n => noticiaVisibleParaAudienciaUsuario(n, usuarioAudiencia))

        return { success: true, data: filtered }
      }

      // Sin club_id: solo noticias globales (club_id IS NULL)
      const supabase = createClient()

      const query = supabase
        .from('comunicacion_noticias')
        .select(SELECT_NOTICIA_BASE)
        .is('club_id', null)
        .eq('activo', true)
        .lte('fecha_inicio', hoy)
        .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      const mappedData = (data ?? []).map(row =>
        mapNoticiaControllerRow(row as unknown as NoticiaControllerRow)
      )

      const filtered = mappedData.filter(n => noticiaVisibleParaAudienciaUsuario(n, usuarioAudiencia))

      return { success: true, data: filtered }
    } catch (err) {
      console.error('Error en comunicacionController.getNoticiasParaUsuario:', err)
      return { success: false, error: 'Error al obtener las noticias' }
    }
  },

  async getNoticiasDestacadas(
    clubId?: string,
    audiencia?: ComunicacionAudiencia,
    rol?: string,
  ): Promise<ApiResponse<Noticia[]>> {
    try {
      const soloGlobal = rol === ROL.ASOCIACION || rol === ROL.ARBITRO
      const data = await comunicacionService.getNoticiasDestacadas(clubId, audiencia, {
        soloNoticiasGlobales: soloGlobal,
      })
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
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
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

      // Si la noticia es destacada, notificar a la audiencia
      if (data.es_destacada) {
        comunicacionController.notificarNoticiaDestacada(data).catch(err => 
          console.error('Error al notificar noticia destacada:', err)
        )
      }

      return { success: true, data }
    } catch (err) {
      console.error('Error en comunicacionController.createNoticia:', err)
      return { success: false, error: 'Error al crear la noticia' }
    }
  },

  /**
   * Envía notificaciones a los usuarios que pertenecen a la audiencia de una noticia destacada.
   * El mapeo de audiencia → rol usa los valores exactos de la tabla usuarios (minúsculas).
   */
  async notificarNoticiaDestacada(noticia: Noticia): Promise<void> {
    const supabase = createClient()
    
    const AUDIENCIA_A_ROL: Record<string, string[]> = {
      judokas:    ['judoka'],
      senseis:    ['sensei', 'encargado'],
      encargados: ['encargado', 'sensei'],
      arbitros:   ['arbitro'],
      todos:      [],
    }

    // 1. Obtener los usuario_id válidos según el club (si no es global)
    let usuariosIds: string[] = []

    if (noticia.club_id) {
      const [judokasRes, senseisRes] = await Promise.all([
        supabase.from('judokas').select('usuario_id').eq('club_id', noticia.club_id),
        supabase.from('senseis').select('usuario_id').eq('club_id', noticia.club_id),
      ])

      if (judokasRes.error) {
        console.error('Error buscando judokas para notificar:', JSON.stringify(judokasRes.error, null, 2))
      }
      if (senseisRes.error) {
        console.error('Error buscando senseis para notificar:', JSON.stringify(senseisRes.error, null, 2))
      }

      const ids = [
        ...(judokasRes.data?.map(j => j.usuario_id) ?? []),
        ...(senseisRes.data?.map(s => s.usuario_id) ?? []),
      ]
      usuariosIds = Array.from(new Set(ids))
    }

    // 2. Construir la query sobre la tabla usuarios
    let query = supabase.from('usuarios').select('id, rol').eq('activo', true)

    if (!noticia.audiencia || noticia.audiencia.length === 0) return

    if (noticia.club_id) {
      if (usuariosIds.length === 0) return
      query = query.in('id', usuariosIds)
    }

    if (!noticia.audiencia.includes('todos')) {
      const rolesSet = new Set<string>()
      noticia.audiencia.forEach(a => {
        const roles = AUDIENCIA_A_ROL[a] ?? []
        roles.forEach(r => rolesSet.add(r))
      })
      
      const rolesArray = Array.from(rolesSet)
      if (rolesArray.length === 0) return
      query = query.in('rol', rolesArray)
    }

    const { data: usuarios, error } = await query

    if (error) {
      console.error('Error detallado en query de notificación:', JSON.stringify(error, null, 2))
      return
    }
    
    if (!usuarios?.length) return

    // 3. Enviar notificaciones
    const promesas = usuarios.map(u => 
      comunicacionController.enviarNotificacion({
        usuario_id: u.id,
        titulo: 'Nueva noticia destacada',
        mensaje: `"${noticia.titulo}" ha sido marcada como destacada. ¡No te la pierdas!`,
        tipo: 'info',
        prioridad: 'normal',
        link_accion: '/comunicacion',
        origen_modulo: 'comunicacion',
        origen_id: noticia.id,
      })
    )

    await Promise.allSettled(promesas)
  },

  async updateNoticia(id: string, payload: Partial<NoticiaCreate>): Promise<ApiResponse<Noticia>> {
    try {
      if (!id) return { success: false, error: 'ID de noticia requerido' }

      // Obtener el estado actual de la noticia antes de actualizar
      const actual = await comunicacionService.getNoticiaById(id)
      if (!actual) return { success: false, error: 'Noticia no encontrada' }

      const parsed = updateNoticiaSchema.safeParse(payload)
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
      }

      const data = await comunicacionService.updateNoticia(id, parsed.data)

      // Notificar si:
      // 1. Se marcó como destacada ahora (y antes no lo era)
      // 2. O si ya era destacada pero se cambió la audiencia
      const seMarcoDestacada = parsed.data.es_destacada === true && actual.es_destacada === false
      const cambioAudiencia = parsed.data.audiencia !== undefined &&
                             JSON.stringify(parsed.data.audiencia) !== JSON.stringify(actual.audiencia)
      const cambioClub =
        parsed.data.club_id !== undefined &&
        (parsed.data.club_id ?? null) !== (actual.club_id ?? null)

      if (seMarcoDestacada || (data.es_destacada && (cambioAudiencia || cambioClub))) {
        comunicacionController.notificarNoticiaDestacada(data).catch(err => 
          console.error('Error al notificar noticia destacada en update:', err)
        )
      }

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

  async getDestinatariosNotificacion(
    remitenteRol: string,
    remitenteClubId?: string | null,
    search?: string
  ): Promise<ApiResponse<NotificacionDestinatario[]>> {
    try {
      if (remitenteRol === ROL.ASOCIACION) {
        const data = await comunicacionService.getDestinatariosParaAsociacion(search)
        return { success: true, data }
      }

      if (remitenteRol === ROL.ENCARGADO) {
        if (!remitenteClubId) {
          return { success: false, error: 'El encargado no tiene un club asignado' }
        }

        const data = await comunicacionService.getDestinatariosByClub(remitenteClubId, search)
        return { success: true, data }
      }

      return { success: false, error: 'No tienes permisos para buscar destinatarios' }
    } catch (err) {
      console.error('Error en comunicacionController.getDestinatariosNotificacion:', err)
      return { success: false, error: 'Error al obtener destinatarios' }
    }
  },

  async enviarNotificacionManual(payload: {
    remitente_id: string
    remitente_rol: string
    remitente_club_id?: string | null
    destinatario_id: string
    titulo: string
    mensaje: string
  }): Promise<ApiResponse<Notificacion>> {
    try {
      const normalizado = {
        ...payload,
        titulo: payload.titulo.replace(/\s+/g, ' ').trim(),
        mensaje: payload.mensaje.replace(/\s+/g, ' ').trim(),
      }

      const parsed = enviarNotificacionManualSchema.safeParse(normalizado)
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
      }

      const destinatario = await comunicacionService.getDestinatarioActivoById(parsed.data.destinatario_id)
      if (!destinatario) {
        return { success: false, error: 'El destinatario no existe o está inactivo' }
      }

      if (parsed.data.remitente_rol === ROL.ENCARGADO) {
        if (!parsed.data.remitente_club_id) {
          return { success: false, error: 'El encargado no tiene un club asignado' }
        }

        const perteneceAlClub = await comunicacionService.usuarioPerteneceAClub(
          parsed.data.destinatario_id,
          parsed.data.remitente_club_id
        )

        if (!perteneceAlClub) {
          return { success: false, error: 'Solo puedes notificar a usuarios de tu club' }
        }
      }

      return comunicacionController.enviarNotificacion({
        usuario_id: parsed.data.destinatario_id,
        titulo: parsed.data.titulo,
        mensaje: parsed.data.mensaje,
        tipo: 'info',
        prioridad: 'normal',
        link_accion: '/comunicacion/notificaciones',
        origen_modulo: null,
        origen_id: null,
      })
    } catch (err) {
      console.error('Error en comunicacionController.enviarNotificacionManual:', err)
      return { success: false, error: 'Error al enviar la notificación' }
    }
  },

  async enviarNotificacion(payload: NotificacionCreate): Promise<ApiResponse<Notificacion>> {
    try {
      const parsed = createNotificacionSchema.safeParse(payload)
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
      }

      if (parsed.data.origen_id && parsed.data.origen_modulo) {
        const yaExiste = await comunicacionService.existeNotificacionOrigen(
          parsed.data.usuario_id,
          parsed.data.origen_id,
          parsed.data.origen_modulo
        )

        if (yaExiste) {
          return { success: true }
        }
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
      link_accion: '/pagos/pendientes',
      origen_modulo: 'tesoreria_pago_vencimiento',
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
