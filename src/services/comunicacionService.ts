import { createClient } from '@/lib/supabase/client'
import {
  Noticia,
  NoticiaCreate,
  NoticiaUpdate,
  Notificacion,
  NotificacionCreate,
  NotificacionContador,
  NotificacionDestinatario,
  ComunicacionAudiencia,
  ComunicacionCategoria,
} from '@/models/comunicacion'
import { ROL, type UserRole } from '@/constants/roles'

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

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '23505'
}

type UsuarioDestinatarioRow = {
  id: string
  correo: string | null
  nombre: string | null
  apellido_paterno: string | null
  apellido_materno: string | null
  rol: UserRole
  activo?: boolean | null
}

type PerfilClubRow = {
  club_id: string | null
  usuarios: UsuarioDestinatarioRow | UsuarioDestinatarioRow[] | null
  clubes?: { nombre_club?: string | null } | { nombre_club?: string | null }[] | null
}

function getSingleJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function getNombreCompleto(usuario: UsuarioDestinatarioRow): string {
  return [
    usuario.nombre,
    usuario.apellido_paterno,
    usuario.apellido_materno,
  ].filter(Boolean).join(' ').trim() || usuario.correo || 'Usuario sin nombre'
}

function mapDestinatarioUsuario(
  usuario: UsuarioDestinatarioRow,
  clubId: string | null = null,
  clubNombre: string | null = null
): NotificacionDestinatario {
  return {
    id: usuario.id,
    nombre_completo: getNombreCompleto(usuario),
    email: usuario.correo ?? '',
    rol: usuario.rol,
    club_id: clubId,
    club_nombre: clubNombre,
  }
}

function normalizeSearchTerm(search?: string): string {
  return (search ?? '').replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim()
}

function filterDestinatariosBySearch(
  destinatarios: NotificacionDestinatario[],
  search?: string
): NotificacionDestinatario[] {
  const term = normalizeSearchTerm(search).toLowerCase()
  if (!term) return destinatarios

  return destinatarios.filter(destinatario => {
    const searchable = [
      destinatario.nombre_completo,
      destinatario.email,
      destinatario.rol,
      destinatario.club_nombre ?? '',
    ].join(' ').toLowerCase()

    return searchable.includes(term)
  })
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

    // Si clubId es 'global', buscamos noticias de la asociación (club_id IS NULL)
    // OJO: Para el panel de administración, esto debe devolver TODAS las noticias sin club_id
    if (clubId === 'global') {
      query = query.is('club_id', null)
    } else {
      // Para un club específico, incluimos las del club O las globales
      // Pero solo si NO estamos en el panel de administración (donde solo_activas es false)
      if (filtros?.solo_activas === false) {
        query = query.eq('club_id', clubId)
      } else {
        query = query.or(`club_id.eq.${clubId},club_id.is.null`)
      }
    }

    if (filtros?.solo_activas !== false) query = query.eq('activo', true)
    if (filtros?.solo_destacadas) query = query.eq('es_destacada', true)
    if (filtros?.categoria) query = query.eq('categoria', filtros.categoria)
    
    // Audiencia: mostrar noticias para el rol específico O para "todos"
    if (filtros?.audiencia && filtros.audiencia !== 'todos') {
      // Si el rol es ENCARGADO, también debe ver noticias para SENSEIS
      // Si el rol es SENSEI, también debe ver noticias para ENCARGADOS
      if (filtros.audiencia === 'senseis' || filtros.audiencia === 'encargados') {
        query = query.or(`audiencia.cs.{senseis},audiencia.cs.{encargados},audiencia.cs.{todos}`)
      } else {
        query = query.or(`audiencia.cs.{${filtros.audiencia}},audiencia.cs.{todos}`)
      }
    }
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

  async getNoticiasDestacadas(
    clubId?: string,
    audiencia?: ComunicacionAudiencia,
    opciones?: { soloNoticiasGlobales?: boolean },
  ): Promise<Noticia[]> {
    const supabase = createClient()
    const hoy = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('comunicacion_noticias')
      .select(SELECT_NOTICIA_BASE)
      .eq('activo', true)
      .eq('es_destacada', true)
      .lte('fecha_inicio', hoy)
      .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)

    if (opciones?.soloNoticiasGlobales) {
      query = query.is('club_id', null)
    } else if (clubId) {
      query = query.or(`club_id.eq.${clubId},club_id.is.null`)
    }

    // Filtrar por audiencia del usuario (igual que en getNoticiasByClub)
    if (audiencia && audiencia !== 'todos') {
      if (audiencia === 'senseis' || audiencia === 'encargados') {
        query = query.or(`audiencia.cs.{senseis},audiencia.cs.{encargados},audiencia.cs.{todos}`)
      } else {
        query = query.or(`audiencia.cs.{${audiencia}},audiencia.cs.{todos}`)
      }
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
      .delete()
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

  async getDestinatariosParaAsociacion(search?: string): Promise<NotificacionDestinatario[]> {
    const supabase = createClient()
    const term = normalizeSearchTerm(search)

    let query = supabase
      .from('usuarios')
      .select('id, correo, nombre, apellido_paterno, apellido_materno, rol')
      .eq('activo', true)
      .order('nombre', { ascending: true })
      .limit(80)

    if (term.length >= 2) {
      query = (query as any).or(
        `nombre.ilike.%${term}%,apellido_paterno.ilike.%${term}%,apellido_materno.ilike.%${term}%,correo.ilike.%${term}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Error en comunicacionService.getDestinatariosParaAsociacion:', error)
      throw error
    }

    return (data ?? []).map(row => mapDestinatarioUsuario(row as UsuarioDestinatarioRow))
  },

  async getDestinatariosByClub(clubId: string, search?: string): Promise<NotificacionDestinatario[]> {
    const supabase = createClient()
    const judokasRes = await supabase
      .from('judokas')
      .select('club_id, usuarios:usuario_id(id, correo, nombre, apellido_paterno, apellido_materno, rol, activo), clubes:club_id(nombre_club)')
      .eq('club_id', clubId)

    if (judokasRes.error) {
      console.error('Error en comunicacionService.getDestinatariosByClub judokas:', judokasRes.error)
      throw judokasRes.error
    }

    const senseisRes = await supabase
      .from('senseis')
      .select('club_id, usuarios:usuario_id(id, correo, nombre, apellido_paterno, apellido_materno, rol, activo), clubes:club_id(nombre_club)')
      .eq('club_id', clubId)

    if (senseisRes.error) {
      console.error('Error en comunicacionService.getDestinatariosByClub senseis:', senseisRes.error)
      throw senseisRes.error
    }

    const rows = [
      ...((judokasRes.data ?? []) as PerfilClubRow[]),
      ...((senseisRes.data ?? []) as PerfilClubRow[]),
    ]

    const destinatariosMap = new Map<string, NotificacionDestinatario>()

    rows.forEach(row => {
      const usuario = getSingleJoin(row.usuarios)
      if (!usuario || usuario.activo === false || usuario.rol === ROL.ASOCIACION || usuario.rol === ROL.ADMIN) return

      const club = getSingleJoin(row.clubes)
      destinatariosMap.set(
        usuario.id,
        mapDestinatarioUsuario(usuario, row.club_id, club?.nombre_club ?? null)
      )
    })

    return filterDestinatariosBySearch(
      Array.from(destinatariosMap.values()).sort((a, b) =>
        a.nombre_completo.localeCompare(b.nombre_completo, 'es')
      ),
      search
    ).slice(0, 80)
  },

  async getDestinatariosBySensei(senseiId: string, search?: string): Promise<NotificacionDestinatario[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('judokas')
      .select('club_id, usuarios:usuario_id(id, correo, nombre, apellido_paterno, apellido_materno, rol, activo), clubes:club_id(nombre_club)')
      .eq('entrenador_id', senseiId)

    if (error) {
      console.error('Error en comunicacionService.getDestinatariosBySensei:', error)
      throw error
    }

    const destinatarios: NotificacionDestinatario[] = (data ?? [])
      .map(row => {
        const usuario = getSingleJoin(row.usuarios)
        if (!usuario || usuario.activo === false) return null
        const club = getSingleJoin(row.clubes)
        return mapDestinatarioUsuario(usuario, row.club_id, club?.nombre_club ?? null)
      })
      .filter((u): u is NotificacionDestinatario => u !== null)

    return filterDestinatariosBySearch(
      destinatarios.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, 'es')),
      search
    ).slice(0, 80)
  },

  async getDestinatarioActivoById(usuarioId: string): Promise<NotificacionDestinatario | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, correo, nombre, apellido_paterno, apellido_materno, rol')
      .eq('id', usuarioId)
      .eq('activo', true)
      .maybeSingle()

    if (error) {
      console.error('Error en comunicacionService.getDestinatarioActivoById:', error)
      throw error
    }

    return data ? mapDestinatarioUsuario(data as UsuarioDestinatarioRow) : null
  },

  async usuarioPerteneceAClub(usuarioId: string, clubId: string): Promise<boolean> {
    const supabase = createClient()
    const judokaRes = await supabase
      .from('judokas')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('club_id', clubId)
      .limit(1)

    if (judokaRes.error) {
      console.error('Error en comunicacionService.usuarioPerteneceAClub judokas:', judokaRes.error)
      throw judokaRes.error
    }

    const senseiRes = await supabase
      .from('senseis')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('club_id', clubId)
      .limit(1)

    if (senseiRes.error) {
      console.error('Error en comunicacionService.usuarioPerteneceAClub senseis:', senseiRes.error)
      throw senseiRes.error
    }

    return (judokaRes.data?.length ?? 0) > 0 || (senseiRes.data?.length ?? 0) > 0
  },

  async judokaPerteneceASensei(usuarioId: string, senseiId: string): Promise<boolean> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('judokas')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('entrenador_id', senseiId)
      .limit(1)

    if (error) {
      console.error('Error en comunicacionService.judokaPerteneceASensei:', error)
      throw error
    }

    return (data?.length ?? 0) > 0
  },

  async createNotificacion(payload: NotificacionCreate): Promise<Notificacion> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_notificaciones')
      .insert(payload)
      .select(SELECT_NOTIFICACION_BASE)
      .single()

    if (error) {
      if (isUniqueViolation(error) && payload.origen_id && payload.origen_modulo) {
        const existente = await comunicacionService.getNotificacionByOrigen(
          payload.usuario_id,
          payload.origen_id,
          payload.origen_modulo
        )
        if (existente) return existente
      }

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

  // ─── Storage ─────────────────────────────────────────────────────────────

  /**
   * Sube una imagen al bucket noticias-imagenes y retorna la URL pública.
   * El archivo se nombra con un timestamp + nombre original para evitar colisiones.
   */
  async uploadImagenNoticia(file: File): Promise<string> {
    const supabase = createClient()
    const extension = file.name.split('.').pop() ?? 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
    const path = `portadas/${filename}`

    const { error } = await supabase.storage
      .from('noticias-imagenes')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) {
      console.error('Error en comunicacionService.uploadImagenNoticia:', error)
      throw error
    }

    const { data } = supabase.storage
      .from('noticias-imagenes')
      .getPublicUrl(path)

    return data.publicUrl
  },

  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    const supabase = createClient()
    const res = await supabase
      .from('comunicacion_notificaciones')
      .update({ leido: true, leido_at: new Date().toISOString() })
      .eq('usuario_id', usuarioId)
      .eq('leido', false)

    if (res.error) {
      console.error('Error en comunicacionService.marcarTodasLeidas:', res.error)
      throw res.error
    }
  },

  /**
   * Verifica si ya existe una notificación para el origen indicado.
   * Evita duplicar alertas automáticas de vencimiento o creación de pago.
   */
  async existeNotificacionOrigen(usuarioId: string, origenId: string, origenModulo: string): Promise<boolean> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_notificaciones')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('origen_id', origenId)
      .eq('origen_modulo', origenModulo)
      .eq('activo', true)
      .limit(1)

    if (error) return false
    return (data?.length ?? 0) > 0
  },

  async getNotificacionByOrigen(
    usuarioId: string,
    origenId: string,
    origenModulo: string
  ): Promise<Notificacion | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comunicacion_notificaciones')
      .select(SELECT_NOTIFICACION_BASE)
      .eq('usuario_id', usuarioId)
      .eq('origen_id', origenId)
      .eq('origen_modulo', origenModulo)
      .eq('activo', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error en comunicacionService.getNotificacionByOrigen:', error)
      throw error
    }

    return data ? mapNotificacionRow(data as Record<string, unknown>) : null
  },
}
