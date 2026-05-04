/**
 * Modelos del Módulo de Comunicación: Noticias y Notificaciones.
 * Reflejan 1:1 las tablas de Supabase (snake_case).
 */

// ─── ENUMs ────────────────────────────────────────────────────────────────────

export type ComunicacionCategoria = 'evento' | 'institucional' | 'logro'

export type ComunicacionAudiencia = 'todos' | 'judokas' | 'senseis' | 'arbitros' | 'encargados'

export type ComunicacionNotifTipo = 'pago' | 'examen' | 'asistencia' | 'logro' | 'info'

export type ComunicacionNotifPrioridad = 'alta' | 'normal'

// ─── Noticias ─────────────────────────────────────────────────────────────────

/** Fila completa de comunicacion_noticias */
export interface Noticia {
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
  /** Campos resueltos por JOIN con usuarios */
  nombre_autor?: string
  /** Campos resueltos por JOIN con clubes */
  nombre_club?: string | null
}

/** Payload para crear una noticia */
export type NoticiaCreate = Omit<Noticia,
  'id' | 'activo' | 'created_at' | 'updated_at' | 'nombre_autor' | 'nombre_club'
>

/** Payload para actualizar una noticia */
export type NoticiaUpdate = Partial<Pick<Noticia,
  'titulo' | 'contenido' | 'categoria' | 'imagen_url' | 'es_destacada' |
  'audiencia' | 'fecha_inicio' | 'fecha_fin' | 'activo'
>>

// ─── Notificaciones ───────────────────────────────────────────────────────────

/** Fila completa de comunicacion_notificaciones */
export interface Notificacion {
  id: string
  usuario_id: string
  titulo: string
  mensaje: string
  tipo: ComunicacionNotifTipo
  prioridad: ComunicacionNotifPrioridad
  leido: boolean
  link_accion: string | null
  origen_modulo: string | null
  origen_id: string | null
  activo: boolean
  leido_at: string | null
  created_at: string
}

/** Payload para crear una notificación (desde controladores/módulos) */
export type NotificacionCreate = Omit<Notificacion,
  'id' | 'leido' | 'leido_at' | 'activo' | 'created_at'
>

/** Resumen para el contador de la campana */
export interface NotificacionContador {
  total_no_leidas: number
  tiene_alta_prioridad: boolean
}
