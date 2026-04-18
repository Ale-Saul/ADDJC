import { z } from 'zod'

/**
 * Esquemas de validación para el módulo de asistencia usando Zod.
 */

// Estado de asistencia
export const estadoAsistenciaSchema = z.enum(['presente', 'ausente'], {
  errorMap: () => ({ message: 'Estado de asistencia inválido (presente/ausente)' }),
})

/**
 * Esquema para crear una sesión de asistencia
 */
export const createSesionSchema = z.object({
  club_id: z.string().uuid('ID de club inválido'),
  sensei_id: z.string().uuid('ID de sensei inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Formato de hora inválido').nullable().optional(),
  hora_fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Formato de hora inválido').nullable().optional(),
  titulo: z.string().max(120, 'El título no puede exceder 120 caracteres').nullable().optional(),
  notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
}).refine(data => {
  if (data.hora_inicio && data.hora_fin) {
    return data.hora_fin > data.hora_inicio
  }
  return true
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['hora_fin'],
})

/**
 * Esquema para actualizar una sesión
 */
export const updateSesionSchema = z.object({
  titulo: z.string().max(120, 'El título no puede exceder 120 caracteres').nullable().optional(),
  notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Formato de hora inválido').nullable().optional(),
  hora_fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Formato de hora inválido').nullable().optional(),
  activo: z.boolean().optional(),
}).refine(data => {
  if (data.hora_inicio && data.hora_fin) {
    return data.hora_fin > data.hora_inicio
  }
  return true
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['hora_fin'],
})

/**
 * Esquema para marcar asistencia de un judoka (individual)
 */
export const asistenciaDetalleSchema = z.object({
  judoka_id: z.string().uuid('ID de judoka inválido'),
  estado: estadoAsistenciaSchema,
  observacion: z.string().max(255, 'La observación no puede exceder 255 caracteres').nullable().optional(),
})

/**
 * Esquema para marcar asistencia masiva (lista completa)
 */
export const asistenciaMasivaSchema = z.object({
  sesion_id: z.string().uuid('ID de sesión inválido'),
  asistencias: z.array(asistenciaDetalleSchema).min(1, 'Debe haber al menos un judoka en la lista'),
})

/**
 * Esquema para filtros de reportes de asistencia
 */
export const filtroAsistenciaSchema = z.object({
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  club_id: z.string().uuid().optional(),
  sensei_id: z.string().uuid().optional(),
  judoka_id: z.string().uuid().optional(),
})
