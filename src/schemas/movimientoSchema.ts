import { z } from 'zod'
import { TIPO_MOVIMIENTO, CATEGORIA_MOVIMIENTO, ESTADO_MOVIMIENTO } from '@/constants/contabilidad'

const TipoMovimientoEnum = z.enum([
  TIPO_MOVIMIENTO.INGRESO,
  TIPO_MOVIMIENTO.EGRESO
])

const CategoriaMovimientoEnum = z.enum([
  CATEGORIA_MOVIMIENTO.DONACION_CLUB,
  CATEGORIA_MOVIMIENTO.PAGO_CLUB,
  CATEGORIA_MOVIMIENTO.APORTE_ESTADO,
  CATEGORIA_MOVIMIENTO.SPONSOR,
  CATEGORIA_MOVIMIENTO.EVENTO,
  CATEGORIA_MOVIMIENTO.GASTO_OPERATIVO,
  CATEGORIA_MOVIMIENTO.PAGO_PROVEEDOR,
  CATEGORIA_MOVIMIENTO.OTRO
])

const EstadoMovimientoEnum = z.enum([
  ESTADO_MOVIMIENTO.REGISTRADO,
  ESTADO_MOVIMIENTO.APROBADO,
  ESTADO_MOVIMIENTO.ANULADO
])

export const createMovimientoSchema = z.object({
  tipo: TipoMovimientoEnum,
  categoria: CategoriaMovimientoEnum,
  monto: z.number().positive('El monto debe ser mayor a 0'),
  concepto: z.string().min(1, 'El concepto es requerido'),
  descripcion: z.string().optional(),
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), 'La fecha no es válida'),
  origen_club_id: z.string().optional(),
  origen_entidad: z.string().optional(),
  comprobante_url: z.string().optional().nullable(),
  comprobante_nombre: z.string().optional().nullable(),
  estado: z.string().optional(),
  notas: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validaciones condicionales
  if ((data.categoria === CATEGORIA_MOVIMIENTO.DONACION_CLUB || data.categoria === CATEGORIA_MOVIMIENTO.PAGO_CLUB) && !data.origen_club_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Para movimientos de club, debe especificar el club de origen',
      path: ['origen_club_id']
    })
  }

  if (data.categoria === CATEGORIA_MOVIMIENTO.APORTE_ESTADO && !data.origen_entidad) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Para aportes del estado, debe especificar la entidad',
      path: ['origen_entidad']
    })
  }
})

export const updateMovimientoSchema = z.object({
  tipo: TipoMovimientoEnum.optional(),
  categoria: CategoriaMovimientoEnum.optional(),
  monto: z.number().positive('El monto debe ser mayor a 0').optional(),
  concepto: z.string().min(1, 'El concepto no puede estar vacío').optional(),
  descripcion: z.string().optional(),
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), 'La fecha no es válida').optional(),
  origen_club_id: z.string().optional(),
  origen_entidad: z.string().optional(),
  comprobante_url: z.string().optional().nullable(),
  comprobante_nombre: z.string().optional().nullable(),
  estado: EstadoMovimientoEnum.optional(),
  notas: z.string().optional(),
})
