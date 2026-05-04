import { createClient } from '@/lib/supabase/client'
import {
  Noticia,
  NoticiaCreate,
  NoticiaUpdate,
  Notificacion,
  NotificacionCreate,
  NotificacionContador,
  ComunicacionAudiencia,
  ComunicacionCategoria,
} from '@/models/comunicacion'

// ─── Columnas explícitas (anti over-fetching) ────────────────────────────────

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

const SELECT_NOTIFICACION_BASE = `
  id,
  usuario_id,
  titulo,
  mensaje,
  tipo,
  prioridad,
  leido,
  link_accion,
  origen_modulo,
  origen_id,
  activo,
  leido_at,
  created_at
`

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapNoticiaRow(row: Record<string, unknown>): Noticia {
  const autor = row.usuarios as { nombre?: string; apellido_paterno?: string } | null
  const club = row.clubes as { nombre_club?: string } | null
  return {
    id: row.id as string,
    club_id: row.club_id as string | null,
    autor_id: row.autor_id as string,
    titulo: row.titulo as string,
    contenido: row.contenido as string,
    categoria: row.categoria as Noticia['categoria'],
    imagen_url: row.imagen_url as string | null,
    es_destacada: row.es_destacada as boolean,
    audiencia: row.audiencia as ComunicacionAudiencia[],
    fecha_inicio: row.fecha_inicio as string,
    fecha_fin: row.fecha_fin as string | null,
    activo: row.activo as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    nombre_autor: autor
      ? [autor.nombre, autor.apellido_paterno].filter(Boolean).join(' ')
      : undefined,
    nombre_club: club?.nombre_club ?? null,
  }
}

function mapNotificacionRow(row: Record<string, unknown>): Notificacion {
  return {
    id: row.id as string,
    usuario_id: row.usuario_id as string,
    titulo: row.titulo as string,
    mensaje: row.mensaje as string,
    tipo: row.tipo as Notificacion['tipo'],
    prioridad: row.prioridad as Notificacion['prioridad'],
    leido: row.leido as boolean,
    link_accion: row.link_accion as string | null,
    origen_modulo: row.origen_modulo as string | null,
    origen_id: row.origen_id as string | null,
    activo: row.activo as boolean,
    leido_at: row.leido_at as string | null,
    created_at: row.created_at as string,
  }
}

// ─── Noticias ─────────────────────────────────────────────────────────────────

export const comunicacionService = {

  async getNoticiasByClub(
    clubId: string,
    filtros?: {
      categoria?: ComunicacionCategoria
      audiencia?: ComunicacionAudiencia
      solo_destacadas?: boolean
      solo_activas?: boolean
      fecha_referencia?: string
    }
  ): Promise<Noticia[]> {
    const supabase = createClient()
    let query = supabase
      .from('comunicacion_noticias')
      .select(SELECT_NOTICIA_BASE)
      .eq('club_id', clubId)

    if (filtros?.solo_activas !== false) query = query.eq('activo', true)
    if (filtros?.solo_destacadas) query = query.eq('es_destacada', true)
    if (filtros?.categoria) query = query.eq('categoria', filtros.categoria)
    if (filtros?.audiencia) query = query.contains('audiencia', [filtros.audiencia])
    if (filtros?.fecha_referencia) {
      query = query
        .lte('fecha_inicio', filtros.fecha_referencia)
        .or(`fecha_fin.is.null,fecha_fin.gte.${filtros.fecha_referencia}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error en comunicacionService.getNoticiasByClub:', error)
      throw error
    }

    return (data ?? []).map(row => mapNoticiaRow(row as Record<string, unknown>))
  },

  async getNoticiasDestacadas(clubId?: string): Promise<Noticia[]> {
    const supabase = createClient()
    const hoy = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('comunicacion_noticias')
      .select(SELECT_NOTICIA_BASE)
      .eq('activo', true)
      .eq('es_destacada', true)
      .lte('fecha_inicio', hoy)
      .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)

    if (clubId) {
      query = query.or(`club_id.eq.${clubId},club_id.is.null`)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(3)

    if (error) {
      console.error('Error en comunicacionService.getNoticiasDestacadas:', error)
      throw error
    }

    return (data ?? []).map(row => mapNoticiaRow(row as Record<string, unknown>))
  },

  async getNoticiaById(id: string): Promise<Noticia | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_noticias')
      .select(SELECT_NOTICIA_BASE)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error en comunicacionService.getNoticiaById:', error)
      throw error
    }

    return data ? mapNoticiaRow(data as Record<string, unknown>) : null
  },

  async createNoticia(payload: NoticiaCreate): Promise<Noticia> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_noticias')
      .insert(payload)
      .select(SELECT_NOTICIA_BASE)
      .single()

    if (error) {
      console.error('Error en comunicacionService.createNoticia:', error)
      throw error
    }

    return mapNoticiaRow(data as Record<string, unknown>)
  },

  async updateNoticia(id: string, payload: NoticiaUpdate): Promise<Noticia> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_noticias')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SELECT_NOTICIA_BASE)
      .single()

    if (error) {
      console.error('Error en comunicacionService.updateNoticia:', error)
      throw error
    }

    return mapNoticiaRow(data as Record<string, unknown>)
  },

  async deleteNoticia(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('comunicacion_noticias')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error en comunicacionService.deleteNoticia:', error)
      throw error
    }
  },

  // ─── Notificaciones ─────────────────────────────────────────────────────────

  async getNotificacionesByUsuario(usuarioId: string): Promise<Notificacion[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_notificaciones')
      .select(SELECT_NOTIFICACION_BASE)
      .eq('usuario_id', usuarioId)
      .eq('activo', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error en comunicacionService.getNotificacionesByUsuario:', error)
      throw error
    }

    return (data ?? []).map(row => mapNotificacionRow(row as Record<string, unknown>))
  },

  async getContadorNoLeidas(usuarioId: string): Promise<NotificacionContador> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_notificaciones')
      .select('id, prioridad')
      .eq('usuario_id', usuarioId)
      .eq('leido', false)
      .eq('activo', true)

    if (error) {
      console.error('Error en comunicacionService.getContadorNoLeidas:', error)
      throw error
    }

    const rows = (data ?? []) as { id: string; prioridad: string }[]
    return {
      total_no_leidas: rows.length,
      tiene_alta_prioridad: rows.some(r => r.prioridad === 'alta'),
    }
  },

  async createNotificacion(payload: NotificacionCreate): Promise<Notificacion> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_notificaciones')
      .insert(payload)
      .select(SELECT_NOTIFICACION_BASE)
      .single()

    if (error) {
      console.error('Error en comunicacionService.createNotificacion:', error)
      throw error
    }

    return mapNotificacionRow(data as Record<string, unknown>)
  },

  async marcarComoLeida(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('comunicacion_notificaciones')
      .update({ leido: true, leido_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error en comunicacionService.marcarComoLeida:', error)
      throw error
    }
  },

  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('comunicacion_notificaciones')
      .update({ leido: true, leido_at: new Date().toISOString() })
      .eq('usuario_id', usuarioId)
      .eq('leido', false)

    if (error) {
      console.error('Error en comunicacionService.marcarTodasLeidas:', error)
      throw error
    }
  },
}
