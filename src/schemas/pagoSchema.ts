import { z } from 'zod'
import { TIPO_PAGO, ESTADO_PAGO, TIPO_DESCUENTO, RAZON_DESCUENTO, METODO_PAGO } from '@/constants/pagos'

// Enums como Zod Enums
const TipoPagoEnum = z.enum([
  TIPO_PAGO.MENSUALIDAD,
  TIPO_PAGO.INSCRIPCION,
  TIPO_PAGO.EXAMEN,
  TIPO_PAGO.TORNEO,
  TIPO_PAGO.EVENTO,
  TIPO_PAGO.OTRO
])

const EstadoPagoEnum = z.enum([
  ESTADO_PAGO.PENDIENTE,
  ESTADO_PAGO.PAGADO,
  ESTADO_PAGO.VENCIDO,
  ESTADO_PAGO.CANCELADO,
  ESTADO_PAGO.REEMBOLSADO
])

const TipoDescuentoEnum = z.enum([
  TIPO_DESCUENTO.PORCENTAJE,
  TIPO_DESCUENTO.MONTO_FIJO,
  TIPO_DESCUENTO.NINGUNO
])

const RazonDescuentoEnum = z.enum([
  RAZON_DESCUENTO.BECA,
  RAZON_DESCUENTO.PROMOCION,
  RAZON_DESCUENTO.HERMANOS,
  RAZON_DESCUENTO.ANTICIPADO,
  RAZON_DESCUENTO.ESPECIAL,
  RAZON_DESCUENTO.NINGUNO
])

// Schema para crear pago
export const createPagoSchema = z.object({
  judoka_id: z.string().min(1, 'El ID del judoka es requerido'),
  club_id: z.string().min(1, 'El ID del club es requerido'),
  tipo_pago: TipoPagoEnum,
  concepto: z.string()
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(255, 'El concepto no puede exceder 255 caracteres'),
  descripcion: z.string().nullable().optional(),
  monto_base: z.number().positive('El monto base debe ser mayor a 0'),
  tiene_descuento: z.boolean().default(false),
  tipo_descuento: TipoDescuentoEnum.nullable().optional(),
  descuento_porcentaje: z.number().min(0).max(100).nullable().optional(),
  descuento_monto: z.number().min(0).nullable().optional(),
  razon_descuento: RazonDescuentoEnum.nullable().optional(),
  monto_final: z.number().optional(), // Se calcula, pero puede venir
  estado: EstadoPagoEnum.default(ESTADO_PAGO.PENDIENTE),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  fecha_pago: z.string().nullable().optional(),
  metodo_pago: z.string().nullable().optional(),
  comprobante_url: z.string().nullable().optional(),
  observaciones_pago: z.string().nullable().optional(),
  creador_id: z.string().min(1, 'El ID del creador es requerido'),
  activo: z.boolean().default(true)
}).superRefine((data, ctx) => {
  if (data.tiene_descuento) {
    if (!data.tipo_descuento || data.tipo_descuento === TIPO_DESCUENTO.NINGUNO) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe especificar el tipo de descuento',
        path: ['tipo_descuento']
      })
    }

    if (data.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE) {
      if (data.descuento_porcentaje === null || data.descuento_porcentaje === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El porcentaje de descuento es requerido',
          path: ['descuento_porcentaje']
        })
      }
    }

    if (data.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO) {
      if (data.descuento_monto === null || data.descuento_monto === undefined || data.descuento_monto <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El monto de descuento debe ser mayor a 0',
          path: ['descuento_monto']
        })
      } else if (data.descuento_monto > data.monto_base) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El descuento no puede ser mayor al monto base',
          path: ['descuento_monto']
        })
      }
    }
  }
})

// Schema para actualizar pago
export const updatePagoSchema = z.object({
  tipo_pago: TipoPagoEnum.optional(),
  concepto: z.string()
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(255, 'El concepto no puede exceder 255 caracteres')
    .optional(),
  descripcion: z.string().nullable().optional(),
  monto_base: z.number().positive('El monto base debe ser mayor a 0').optional(),
  tiene_descuento: z.boolean().optional(),
  tipo_descuento: TipoDescuentoEnum.nullable().optional(),
  descuento_porcentaje: z.number().min(0).max(100).nullable().optional(),
  descuento_monto: z.number().min(0).nullable().optional(),
  razon_descuento: RazonDescuentoEnum.nullable().optional(),
  estado: EstadoPagoEnum.optional(),
  fecha_vencimiento: z.string().optional(),
  fecha_pago: z.string().nullable().optional(),
  metodo_pago: z.string().nullable().optional(),
  comprobante_url: z.string().nullable().optional(),
  observaciones_pago: z.string().nullable().optional(),
  pagador_id: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  monto_final: z.number().optional()
})

export const pagoMasivoSchema = z.object({
  tipo_pago: z.string().min(1, 'El tipo de pago es requerido'),
  concepto: z.string().min(1, 'El concepto es requerido'),
  descripcion: z.string().optional().nullable(),
  monto_base: z.union([z.number(), z.string()])
    .refine(val => val !== '' && val !== undefined && val !== null, 'El monto base es requerido')
    .transform(val => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)
    .pipe(z.number().positive('El monto base debe ser mayor a 0')),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  tiene_descuento: z.boolean().default(false),
  tipo_descuento: z.string().optional().nullable(),
  descuento_porcentaje: z.union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(val => (val === '' || val === undefined || val === null) ? null : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)
    .pipe(z.number().min(0).max(100).nullable()),
  descuento_monto: z.union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(val => (val === '' || val === undefined || val === null) ? null : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)
    .pipe(z.number().min(0).nullable()),
  razon_descuento: z.string().optional().nullable(),
})

export const editarPagoSchema = z.object({
  tipo_pago: z.string().min(1, 'El tipo de pago es requerido'),
  concepto: z.string().min(1, 'El concepto es requerido'),
  descripcion: z.string().optional().nullable(),
  monto_base: z.union([z.number(), z.string()])
    .refine(val => val !== '' && val !== undefined && val !== null, 'El monto base es requerido')
    .transform(val => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)
    .pipe(z.number().min(0, 'El monto debe ser mayor o igual a 0')),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'), 
  tiene_descuento: z.boolean().default(false),
  tipo_descuento: z.string().optional().nullable(),
  descuento_porcentaje: z.union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(val => (val === '' || val === undefined || val === null) ? null : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)
    .pipe(z.number().min(0, 'El descuento debe ser mayor o igual a 0').max(100, 'El porcentaje no puede ser mayor a 100').nullable()),       
  descuento_monto: z.union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(val => (val === '' || val === undefined || val === null) ? null : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)
    .pipe(z.number().min(0, 'El descuento debe ser mayor o igual a 0').nullable()),
  razon_descuento: z.string().optional().nullable(),
})

export const registrarPagoSchema = z.object({
  metodo_pago: z.string().min(1, 'El método de pago es requerido'),
  observaciones_pago: z.string().optional().nullable(),
})
