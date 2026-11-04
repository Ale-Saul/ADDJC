/**
 * Modelos para el registro de asistencia y control de asistencia de entrenadores con geolocalización.
 */

export type TipoEventoEntrenador = 'entrenamiento' | 'partido'
export type EstadoAsistenciaEntrenador = 'en_curso' | 'completado'

export interface AsistenciaEntrenador {
  id: string
  club_id: string
  entrenador_id: string
  tipo_evento: TipoEventoEntrenador
  categoria?: string | null
  titulo?: string | null
  fecha: string // YYYY-MM-DD
  
  // Entrada (Check-in)
  hora_entrada: string // ISO timestamp
  latitud_entrada?: number | null
  longitud_entrada?: number | null
  precision_entrada?: number | null // Metros de precisión del GPS
  ubicacion_texto_entrada?: string | null
  
  // Salida (Check-out)
  hora_salida?: string | null // ISO timestamp
  latitud_salida?: number | null
  longitud_salida?: number | null
  precision_salida?: number | null
  ubicacion_texto_salida?: string | null
  
  estado: EstadoAsistenciaEntrenador
  notas?: string | null
  
  created_at: string
  updated_at: string

  // Joins virtuales
  nombre_entrenador?: string
  apellido_entrenador?: string
  nombre_club?: string
}

export interface MarcarEntradaDTO {
  club_id: string
  entrenador_id: string
  tipo_evento: TipoEventoEntrenador
  categoria?: string | null
  titulo?: string | null
  latitud?: number | null
  longitud?: number | null
  precision?: number | null
  ubicacion_texto?: string | null
  notas?: string | null
}

export interface MarcarSalidaDTO {
  id: string
  latitud?: number | null
  longitud?: number | null
  precision?: number | null
  ubicacion_texto?: string | null
  notas?: string | null
}

