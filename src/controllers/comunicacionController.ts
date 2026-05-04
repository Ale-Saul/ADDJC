import { comunicacionService } from '@/services/comunicacionService'
import { createClient } from '@/lib/supabase/client'
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
      categoria?: string
      audiencia?: string
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
        categoria: filtros?.categoria as any,
        audiencia: filtros?.audiencia as any,
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

      // Si es rol ASOCIACION, solo ve noticias globales (club_id IS NULL)
      if (rol === 'asociacion') {
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
        
        const mappedData = (data ?? []).map((row: any) => {
          const autor = row.usuarios as { nombre?: string; apellido_paterno?: string } | null
          const club = row.clubes as { nombre_club?: string } | null
          return {
            ...row,
            nombre_autor: autor ? [autor.nombre, autor.apellido_paterno].filter(Boolean).join(' ') : undefined,
            nombre_club: club?.nombre_club ?? null,
          }
        })

        return { success: true, data: mappedData as Noticia[] }
      }

      if (clubId) {
        const data = await comunicacionService.getNoticiasByClub(clubId, {
          audiencia: usuarioAudiencia,
          solo_activas: true,
          fecha_referencia: hoy,
        })
        
        // Filtrar por audiencia en JS para asegurar cumplimiento estricto
        const filtered = data.filter(n => {
          if (n.audiencia.includes('todos')) return true
          if (usuarioAudiencia === 'senseis' || usuarioAudiencia === 'encargados') {
            return n.audiencia.includes('senseis') || n.audiencia.includes('encargados')
          }
          return n.audiencia.includes(usuarioAudiencia)
        })

        return { success: true, data: filtered }
      }

      // Sin club_id y no es asociación: solo noticias globales (club_id IS NULL)
      const supabase = createClient()
      
      let query = supabase
        .from('comunicacion_noticias')
        .select(SELECT_NOTICIA_BASE)
        .is('club_id', null)
        .eq('activo', true)
        .lte('fecha_inicio', hoy)
        .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      
      const mappedData = (data ?? []).map((row: any) => {
        const autor = row.usuarios as { nombre?: string; apellido_paterno?: string } | null
        const club = row.clubes as { nombre_club?: string } | null
        return {
          ...row,
          nombre_autor: autor ? [autor.nombre, autor.apellido_paterno].filter(Boolean).join(' ') : undefined,
          nombre_club: club?.nombre_club ?? null,
          audiencia: row.audiencia as string[]
        }
      })

      // Filtrar por audiencia en JS
      const filtered = mappedData.filter(n => {
        if (n.audiencia.includes('todos')) return true
        if (usuarioAudiencia === 'senseis' || usuarioAudiencia === 'encargados') {
          return n.audiencia.includes('senseis') || n.audiencia.includes('encargados')
        }
        return n.audiencia.includes(usuarioAudiencia)
      })

      return { success: true, data: filtered as Noticia[] }
    } catch (err) {
      console.error('Error en comunicacionController.getNoticiasParaUsuario:', err)
      return { success: false, error: 'Error al obtener las noticias' }
    }
  },

  async getNoticiasDestacadas(clubId?: string, audiencia?: ComunicacionAudiencia): Promise<ApiResponse<Noticia[]>> {
    try {
      const data = await comunicacionService.getNoticiasDestacadas(clubId, audiencia)
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
      
      if (seMarcoDestacada || (data.es_destacada && cambioAudiencia)) {
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
