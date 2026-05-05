import type { ComunicacionCategoria, ComunicacionAudiencia, ComunicacionNotifTipo } from '@/models/comunicacion'

/** TanStack Query keys para el módulo de comunicación */
export const COMUNICACION_QUERY_KEYS = {
  all: ['comunicacion'] as const,

  // Noticias
  noticias: () => [...COMUNICACION_QUERY_KEYS.all, 'noticias'] as const,
  noticiasByClub: (clubId: string) => [...COMUNICACION_QUERY_KEYS.noticias(), 'club', clubId] as const,
  noticiasDestacadas: (clubId?: string) => [...COMUNICACION_QUERY_KEYS.noticias(), 'destacadas', clubId ?? 'all'] as const,
  noticiaById: (id: string) => [...COMUNICACION_QUERY_KEYS.noticias(), id] as const,

  // Notificaciones
  notificaciones: () => [...COMUNICACION_QUERY_KEYS.all, 'notificaciones'] as const,
  notificacionesByUsuario: (usuarioId: string) => [...COMUNICACION_QUERY_KEYS.notificaciones(), usuarioId] as const,
  notificacionesContador: (usuarioId: string) => [...COMUNICACION_QUERY_KEYS.notificaciones(), 'contador', usuarioId] as const,
  notificacionesDestinatarios: (rol: string, clubId?: string | null, search?: string) =>
    [...COMUNICACION_QUERY_KEYS.notificaciones(), 'destinatarios', rol, clubId ?? 'sin-club', search ?? ''] as const,
} as const

/** Labels para las categorías de noticias */
export const CATEGORIA_LABELS: Record<ComunicacionCategoria, string> = {
  evento: 'Evento',
  institucional: 'Institucional',
  logro: 'Logro',
} as const

/** Labels para las audiencias */
export const AUDIENCIA_LABELS: Record<ComunicacionAudiencia, string> = {
  todos: 'Todos',
  judokas: 'Judokas',
  senseis: 'Senseis',
  arbitros: 'Árbitros',
  encargados: 'Encargados',
} as const

/** Labels para los tipos de notificación */
export const NOTIF_TIPO_LABELS: Record<ComunicacionNotifTipo, string> = {
  pago: 'Pago',
  examen: 'Examen',
  asistencia: 'Asistencia',
  logro: 'Logro',
  info: 'Información',
} as const

/** Colores MUI por categoría de noticia */
export const CATEGORIA_COLOR: Record<ComunicacionCategoria, 'primary' | 'success' | 'warning'> = {
  evento: 'primary',
  logro: 'success',
  institucional: 'warning',
} as const

/** Colores MUI por tipo de notificación */
export const NOTIF_TIPO_COLOR: Record<ComunicacionNotifTipo, 'error' | 'warning' | 'info' | 'success'> = {
  pago: 'error',
  examen: 'warning',
  asistencia: 'info',
  logro: 'success',
  info: 'info',
} as const
