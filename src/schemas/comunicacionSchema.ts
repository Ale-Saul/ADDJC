import { z } from 'zod'

/**
 * Esquemas de validación Zod para el Módulo de Comunicación.
 */

// ─── ENUMs ────────────────────────────────────────────────────────────────────

export const categoriaSchema = z.enum(['evento', 'institucional', 'logro'], {
  error: 'Categoría inválida',
})

export const audienciaSchema = z.enum(
  ['todos', 'judokas', 'senseis', 'arbitros', 'encargados'],
  { error: 'Audiencia inválida' },
)

export const notifTipoSchema = z.enum(
  ['pago', 'examen', 'asistencia', 'logro', 'info'],
  { error: 'Tipo de notificación inválido' },
)

export const notifPrioridadSchema = z.enum(['alta', 'normal'], {
  error: 'Prioridad inválida',
})

// ─── Noticias ─────────────────────────────────────────────────────────────────

/** Schema para crear una noticia */
export const createNoticiaSchema = z.object({
  club_id: z.string().uuid('ID de club inválido').nullable().optional(),
  autor_id: z.string().uuid('ID de autor inválido'),
  titulo: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres')
    .refine(v => !/\s{2,}/.test(v), { message: 'No se permiten espacios consecutivos' }),
  contenido: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .refine(v => !/\s{2,}/.test(v), { message: 'No se permiten espacios consecutivos' }),
  categoria: categoriaSchema,
  imagen_url: z.string().url('URL de imagen inválida').nullable().optional(),
  es_destacada: z.boolean().default(false),
  audiencia: z
    .array(audienciaSchema)
    .min(1, 'Debe seleccionar al menos una audiencia')
    .default(['todos']),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  fecha_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .nullable()
    .optional(),
}).refine(data => {
  if (data.fecha_fin && data.fecha_inicio) {
    return data.fecha_fin >= data.fecha_inicio
  }
  return true
}, {
  message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
  path: ['fecha_fin'],
})

/** Schema para actualizar una noticia */
export const updateNoticiaSchema = z.object({
  titulo: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres')
    .refine(v => !/\s{2,}/.test(v), { message: 'No se permiten espacios consecutivos' })
    .optional(),
  contenido: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .optional(),
  categoria: categoriaSchema.optional(),
  imagen_url: z.string().url('URL de imagen inválida').nullable().optional(),
  es_destacada: z.boolean().optional(),
  audiencia: z.array(audienciaSchema).min(1, 'Debe seleccionar al menos una audiencia').optional(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional(),
  fecha_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
    .nullable()
    .optional(),
  activo: z.boolean().optional(),
})

/** Filtros para listar noticias */
export const filtroNoticiaSchema = z.object({
  club_id: z.string().uuid().optional(),
  categoria: categoriaSchema.optional(),
  audiencia: audienciaSchema.optional(),
  solo_destacadas: z.boolean().optional(),
  solo_activas: z.boolean().optional(),
  fecha_referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// ─── Notificaciones ───────────────────────────────────────────────────────────

/** Schema para crear una notificación */
export const createNotificacionSchema = z.object({
  usuario_id: z.string().uuid('ID de usuario inválido'),
  titulo: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'El título no puede exceder 150 caracteres'),
  mensaje: z.string().min(5, 'El mensaje debe tener al menos 5 caracteres'),
  tipo: notifTipoSchema,
  prioridad: notifPrioridadSchema.default('normal'),
  link_accion: z.string().nullable().optional(),
  origen_modulo: z.string().max(50).nullable().optional(),
  origen_id: z.string().uuid().nullable().optional(),
})
