import { z } from 'zod'

/**
 * Esquemas de validación comunes usando Zod
 */

// Validación de CI: solo números, máximo 7
export const ciSchema = z
  .string()
  .min(1, 'El Carnet de Identidad es requerido')
  .regex(/^\d{1,7}$/, 'El CI debe tener entre 1 y 7 números')

// Validación de Extensión de CI: 1 número y 1 letra (ej: 1A)
export const ciExtensionSchema = z.string()
  .regex(/^[0-9][A-Z]$/, 'Formato inválido (ej: 1A)')
  .optional()
  .nullable()
  .or(z.literal(''))

// Validación de Celular: exactamente 8 dígitos o vacío
export const celularSchema = z
  .string()
  .refine((val) => val === '' || /^\d{8}$/.test(val), {
    message: 'El número debe tener exactamente 8 dígitos',
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
const nameRegex = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]*$/

// Helpers para transformar y limpiar espacios (trim y reduce múltiples espacios a uno)
const cleanStr = (val: string) => val.trim().replace(/\s+/g, ' ')

const zNombreSchema = z.string()
  .transform(cleanStr)
  .pipe(z.string().min(1, 'El campo es requerido').regex(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/, 'Solo se permiten letras y espacios'))

// Validación de año para fechas (no puede ser mayor al actual)
const yearMsg = `La fecha no puede ser posterior a la actual`
const notFutureYear = (val: string | null | undefined) => {
  if (!val) return true
  // Si es una cadena YYYY-MM-DD, extraer componentes para evitar problemas de zona horaria
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [year, month, day] = val.split('-').map(Number)
    const inputDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Permitir hasta el final del día de hoy
    return inputDate <= today
  }
  
  const date = new Date(val)
  if (isNaN(date.getTime())) return true
  
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const inputDate = new Date(date)
  return inputDate <= today
}

const zApellidoOpcionalSchema = z.string().optional().nullable()
  .transform(val => val ? cleanStr(val) : val)
  .pipe(z.string().regex(nameRegex, 'Solo se permiten letras y espacios').optional().nullable())

// Esquema base para Usuarios (campos comunes) - Objeto puro para poder extenderlo
const baseUserObject = z.object({
  nombres: zNombreSchema,
  apellido_paterno: zApellidoOpcionalSchema,
  apellido_materno: zApellidoOpcionalSchema,
  ci: ciSchema,
  ci_extension: ciExtensionSchema,
  fecha_nacimiento: z.string().nullable().optional().refine(notFutureYear, { message: yearMsg }),
  numero_celular: celularSchema.optional(),
  genero: z.string().optional(),
  email: emailSchema,
})

// Validación de que al menos uno de los dos apellidos esté presente
const validateApellidos = (data: { apellido_paterno?: string | null; apellido_materno?: string | null }) => {
  const paterno = (data.apellido_paterno ?? '').trim()
  const materno = (data.apellido_materno ?? '').trim()
  return paterno !== '' || materno !== ''
}

const apellidosErrorConfig = {
  message: 'El campo es requerido',
  path: ['apellido_paterno'], 
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
  nombre_club: z.string()
    .transform(cleanStr)
    .pipe(
      z.string()
        .min(1, 'El nombre del club es requerido')
        .max(200, 'El nombre del club no puede exceder 200 caracteres')
        .regex(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9\s]+$/, 'Solo se permiten letras, números y espacios')
    ),
  provincia: z.string().min(1, 'El municipio es requerido'),
  direccion: z.string()
    .transform(val => val ? cleanStr(val) : val)
    .pipe(
      z.string()
        .max(500, 'La dirección no puede exceder 500 caracteres')
        .optional()
        .nullable()
    ),
  telefono_contacto: telefonoClubSchema.optional(),
  director_tecnico_id: z.string().nullable().optional(),
  activo: z.boolean().default(true),
  // Campos para nuevo director (opcionales en el esquema base, validados en el controller)
  new_nombres: z.string().optional().nullable(),
  new_apellido_paterno: z.string().optional().nullable(),
  new_apellido_materno: z.string().optional().nullable(),
  new_email: z.string().optional().nullable(),
  new_ci: z.string().optional().nullable(),
  new_ci_extension: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.new_nombres === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El nombre es requerido', path: ['new_nombres'] });
  }
  if (data.new_ci === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El CI es requerido', path: ['new_ci'] });
  }
  if (data.new_email === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El email es requerido', path: ['new_email'] });
  } else if (data.new_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.new_email)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email inválido', path: ['new_email'] });
  }
  if (data.new_apellido_paterno === '' && data.new_apellido_materno === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Al menos un apellido es requerido', path: ['new_apellido_paterno'] });
  }
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
    .transform(cleanStr)
    .pipe(
      z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .regex(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/, 'Solo se permiten letras y espacios')
    ),
  apellido_paterno: zApellidoOpcionalSchema,
  apellido_materno: zApellidoOpcionalSchema,
}).superRefine((d, ctx) => {
  const paterno = (d.apellido_paterno ?? '').trim()
  const materno = (d.apellido_materno ?? '').trim()
  if (!paterno && !materno) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El campo es requerido', path: ['apellido_paterno'] })
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
  nombres: z.string().optional()
    .transform(val => val ? cleanStr(val) : val)
    .pipe(
      z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .regex(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/, 'Solo se permiten letras y espacios')
        .optional()
    ),
  apellido_paterno: zApellidoOpcionalSchema,
  apellido_materno: zApellidoOpcionalSchema,
}).superRefine((d, ctx) => {
  if (d.apellido_paterno != null || d.apellido_materno != null) {
    const paterno = (d.apellido_paterno ?? '').trim()
    const materno = (d.apellido_materno ?? '').trim()
    if (!paterno && !materno) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El campo es requerido', path: ['apellido_paterno'] })
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
    .transform(cleanStr)
    .pipe(
      z.string()
        .min(3, 'El nombre del club debe tener al menos 3 caracteres')
        .max(200, 'El nombre del club no puede exceder 200 caracteres')
        .regex(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9\s]+$/, 'Solo se permiten letras, números y espacios')
    ),
  direccion: z.string()
    .transform(val => val ? cleanStr(val) : val)
    .pipe(
      z.string()
        .max(500, 'La dirección no puede exceder 500 caracteres')
        .optional()
        .nullable()
    ),
  telefono_contacto: z.string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .nullable(),
})

/**
 * Validación de club en UPDATE (campos opcionales)
 */
export const clubControllerUpdateSchema = z.object({
  nombre_club: z.string().optional()
    .transform(val => val ? cleanStr(val) : val)
    .pipe(
      z.string()
        .min(3, 'El nombre del club debe tener al menos 3 caracteres')
        .max(200, 'El nombre del club no puede exceder 200 caracteres')
        .regex(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9\s]+$/, 'Solo se permiten letras, números y espacios')
        .optional()
    ),
  direccion: z.string().optional()
    .transform(val => val ? cleanStr(val) : val)
    .pipe(
      z.string()
        .max(500, 'La dirección no puede exceder 500 caracteres')
        .optional()
        .nullable()
    ),
  telefono_contacto: z.string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .nullable(),
})


export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúscula, minúscula y número'),
  confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const perfilSchema = z.object({
  nombres: zNombreSchema,
  primer_apellido: z.string()
    .transform(cleanStr)
    .pipe(z.string().min(1, 'El primer apellido es requerido').regex(nameRegex, 'Solo se permiten letras y espacios')),
  segundo_apellido: zApellidoOpcionalSchema,
})

/**
 * Esquema específico para Certificaciones
 */
export const certificacionSchema = z.object({
  usuario_id: z.string().min(1, 'El ID de usuario es requerido'),
  tipo_afiliado: z.union([z.literal('sensei'), z.literal('arbitro')]),
  nombre_certificacion: z.string().min(1, 'El nombre de la certificación es requerido'),
  descripcion: z.string().nullable().optional(),
  fecha_emision: z.string().nullable().optional(),
  fecha_vencimiento: z.string().nullable().optional(),
  archivo_url: z.string().nullable().optional(),
  activo: z.boolean().default(true),
})
