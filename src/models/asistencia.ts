/**
 * Modelos para el módulo de asistencia.
 * Alineados con el esquema de base de datos en Supabase.
 */

export type EstadoAsistencia = 'presente' | 'ausente'

export interface AsistenciaSesion {
  id: string
  club_id: string
  sensei_id: string
  fecha: string // ISO date string (YYYY-MM-DD)
  hora_inicio: string | null
  hora_fin: string | null
  titulo: string | null
  notas: string | null
  cerrada_at: string | null
  activo: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  
  // Campos virtuales (joins)
  nombre_sensei?: string
  nombre_club?: string
  total_presentes?: number
  total_judokas?: number
}

export interface AsistenciaDetalle {
  id: string
  sesion_id: string
  judoka_id: string
  estado: EstadoAsistencia
  observacion: string | null
  marcado_por: string | null
  marcado_at: string
  created_at: string
  updated_at: string

  // Campos virtuales (joins)
  nombre_judoka?: string
  apellido_judoka?: string
  // Campos de la sesión vinculada (disponibles en historial)
  sesion_fecha?: string
  sesion_titulo?: string | null
}

/**
 * Tipos para creación y actualización
 */

export interface AsistenciaSesionCreate {
  club_id: string
  sensei_id: string
  fecha: string
  hora_inicio?: string | null
  hora_fin?: string | null
  titulo?: string | null
  notas?: string | null
  created_by?: string | null
}

export interface AsistenciaSesionUpdate {
  titulo?: string | null
  notas?: string | null
  hora_inicio?: string | null
  hora_fin?: string | null
  cerrada_at?: string | null
  activo?: boolean
  updated_by?: string | null
}

export interface AsistenciaDetalleUpsert {
  sesion_id: string
  judoka_id: string
  estado: EstadoAsistencia
  observacion?: string | null
  marcado_por?: string | null
}

/**
 * Tipos para reportes y estadísticas
 */

export interface AsistenciaStatsJudoka {
  judoka_id: string
  nombre_judoka?: string
  apellido_judoka?: string
  total_sesiones: number
  presentes: number
  ausentes: number
  porcentaje: number
}

export interface AsistenciaReporteClub {
  club_id: string
  periodo: {
    fecha_inicio: string
    fecha_fin: string
  }
  stats_globales: {
    total_sesiones: number
    promedio_asistencia: number
  }
  stats_por_sensei: Array<{
    sensei_id: string
    nombre: string
    total_sesiones: number
    promedio_asistencia: number
  }>
}
