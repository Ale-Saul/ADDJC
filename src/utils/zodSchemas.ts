import { z } from 'zod'

/**
 * Esquemas de validación comunes usando Zod
 */

// Validación de CI: hasta 7 números, opcionalmente un guión y hasta 3 letras
export const ciSchema = z
  .string()
  .min(1, 'El Carnet de Identidad es requerido')
  .regex(/^\d{1,7}(-[A-Za-z]{1,3})?$/, 'Formato inválido (ej: 1234567-CB)')

// Validación de Celular: exactamente 8 dígitos o vacío
export const celularSchema = z
  .string()
  .refine((val) => val === '' || /^\d{8}$/.test(val), {
    message: 'El número de celular debe tener exactamente 8 dígitos',
  })

// Validación de Teléfono Club: 7 u 8 dígitos
export const telefonoClubSchema = z
  .string()
  .refine((val) => val === '' || /^\d{7,8}$/.test(val), {
    message: 'El teléfono debe tener 7 u 8 dígitos',
  })

// Validación de Email
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('El formato del email no es válido')

// Validación de Password (solo para creación)
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número')

// Esquema para Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
})

// Esquema para Recuperar Contraseña (Solicitud)
export const requestResetSchema = z.object({
  email: emailSchema,
})

// Esquema para Restablecer Contraseña (Nueva Contraseña)
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Regex para nombres y apellidos: solo letras (incluye acentos y Ñ) y espacios
const nameRegex = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/

const currentYear = new Date().getFullYear()
const yearMsg = `El año no puede ser mayor al actual (${currentYear})`
const notFutureYear = (val: string | null | undefined) => !val || new Date(val).getFullYear() <= currentYear

// Esquema base para Usuarios (campos comunes) - Objeto puro para poder extenderlo
const baseUserObject = z.object({
  nombres: z.string()
    .min(1, 'Los nombres son requeridos')
    .regex(nameRegex, 'Solo se permiten letras y espacios'),
  apellido_paterno: z.string().optional().refine(
    (val) => !val || nameRegex.test(val),
    { message: 'Solo se permiten letras y espacios' }
  ),
  apellido_materno: z.string().optional().refine(
    (val) => !val || nameRegex.test(val),
    { message: 'Solo se permiten letras y espacios' }
  ),
  ci: ciSchema,
  fecha_nacimiento: z.string().nullable().optional().refine(notFutureYear, { message: yearMsg }),
  numero_celular: celularSchema.optional(),
  genero: z.string().optional(),
  email: emailSchema,
})

// Validación de que al menos uno de los dos apellidos esté presente
const validateApellidos = (data: { apellido_paterno?: string; apellido_materno?: string }) => {
  const paterno = (data.apellido_paterno ?? '').trim()
  const materno = (data.apellido_materno ?? '').trim()
  return paterno !== '' || materno !== ''
}

const apellidosErrorConfig = {
  message: 'Al menos uno de los dos apellidos es requerido',
  path: ['apellido_paterno'], // El error se asocia al apellido paterno por defecto
}

export const baseUserSchema = baseUserObject.refine(validateApellidos, apellidosErrorConfig)

/**
 * Esquema específico para Judokas
 */
export const judokaSchema = baseUserObject.extend({
  club_id: z.string().nullable().optional(),
  entrenador_id: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
  cinturon_actual: z.string().nullable().optional(),
  activo: z.boolean().default(true),
  password: z.string().optional(),
}).refine(validateApellidos, apellidosErrorConfig)

/**
 * Esquema específico para Senseis
 */
export const senseiSchema = baseUserObject.extend({
  club_id: z.string().nullable().optional(),
  grado_dan: z.string().nullable().optional(),
  especialidad: z.string().nullable().optional(),
  certificacion_id: z.string().nullable().optional(),
  activo: z.boolean().default(true),
  password: z.string().optional(),
}).refine(validateApellidos, apellidosErrorConfig)

/**
 * Esquema específico para Árbitros
 */
export const arbitroSchema = baseUserObject.extend({
  nivel_arbitraje: z.string().nullable().optional(),
  certificacion_id: z.string().nullable().optional(),
  activo: z.boolean().default(true),
  password: z.string().optional(),
}).refine(validateApellidos, apellidosErrorConfig)

/**
 * Esquema específico para Clubes
 */
export const clubSchema = z.object({
  nombre_club: z.string().min(1, 'El nombre del club es requerido'),
  provincia: z.string().min(1, 'El municipio es requerido'),
  direccion: z.string().optional(),
  telefono_contacto: telefonoClubSchema.optional(),
  director_tecnico_id: z.string().nullable().optional(),
  activo: z.boolean().default(true),
})

/**
 * Esquema específico para Miembros de la Asociación
 */
export const miembroAsociacionSchema = baseUserObject.extend({
  cargo: z.string().nullable().optional(),
  fecha_ingreso: z.string().nullable().optional().refine(notFutureYear, { message: yearMsg }),
  activo: z.boolean().default(true),
  password: z.string().optional(),
}).refine(validateApellidos, apellidosErrorConfig)

// ─── Schemas para la capa de controllers ─────────────────────────────────────

/**
 * Validación de nombres/apellidos en operaciones CREATE (sensei, judoka)
 */
export const personNamesCreateSchema = z.object({
  nombres: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(nameRegex, 'Solo se permiten letras y espacios'),
  apellido_paterno: z.string().nullish(),
  apellido_materno: z.string().nullish(),
}).superRefine((d, ctx) => {
  const paterno = (d.apellido_paterno ?? '').trim()
  const materno = (d.apellido_materno ?? '').trim()
  if (!paterno && !materno) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Al menos un apellido (paterno o materno) es requerido', path: ['apellido_paterno'] })
    return
  }
  const combined = [paterno, materno].filter(Boolean).join(' ')
  if (combined.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los apellidos deben tener al menos 2 caracteres', path: ['apellido_paterno'] })
  }
  if (combined.length > 200) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los apellidos no pueden exceder 200 caracteres en total', path: ['apellido_paterno'] })
  }
})

/**
 * Validación de nombres/apellidos en operaciones UPDATE (campos opcionales)
 */
export const personNamesUpdateSchema = z.object({
  nombres: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(nameRegex, 'Solo se permiten letras y espacios')
    .optional(),
  apellido_paterno: z.string().nullish(),
  apellido_materno: z.string().nullish(),
}).superRefine((d, ctx) => {
  if (d.apellido_paterno != null || d.apellido_materno != null) {
    const paterno = (d.apellido_paterno ?? '').trim()
    const materno = (d.apellido_materno ?? '').trim()
    if (!paterno && !materno) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Al menos un apellido debe estar presente', path: ['apellido_paterno'] })
      return
    }
    const combined = [paterno, materno].filter(Boolean).join(' ')
    if (combined.length > 200) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los apellidos no pueden exceder 200 caracteres en total', path: ['apellido_paterno'] })
    }
  }
})

/**
 * Validación de peso_competitivo para judoka
 */
export const pesoSchema = z.number()
  .min(0, 'El peso no puede ser negativo')
  .max(300, 'El peso no puede exceder 300 kg')
  .nullable()
  .optional()

/**
 * Validación de club en CREATE
 */
export const clubControllerCreateSchema = z.object({
  nombre_club: z.string()
    .min(3, 'El nombre del club debe tener al menos 3 caracteres')
    .max(200, 'El nombre del club no puede exceder 200 caracteres'),
  telefono_contacto: z.string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .nullable(),
})

/**
 * Validación de club en UPDATE (campos opcionales)
 */
export const clubControllerUpdateSchema = z.object({
  nombre_club: z.string()
    .min(3, 'El nombre del club debe tener al menos 3 caracteres')
    .max(200, 'El nombre del club no puede exceder 200 caracteres')
    .optional(),
  telefono_contacto: z.string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .nullable(),
})

