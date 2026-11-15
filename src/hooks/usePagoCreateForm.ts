import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { pagoController } from '@/controllers/pagoController'
import { ESTADO_PAGO, RAZON_DESCUENTO, TIPO_DESCUENTO, TIPO_PAGO, MONTO_MENSUALIDAD_DEFAULT } from '@/constants/pagos'
import { generatePagoReceipt } from '@/utils/receiptGenerator'
import { clubController } from '@/controllers/clubController'
import dayjs from 'dayjs'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Un pequeño schema adaptado a los strings del formulario
const uiPagoSchema = z.object({
  judoka_id: z.string().min(1, 'El ID del futbolista es requerido'),
  club_id: z.string().min(1, 'El ID del club es requerido'),
  tipo_pago: z.string().min(1, 'El tipo de pago es requerido'),
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres'),
  descripcion: z.string().optional().nullable(),
  monto_base: z.union([z.number(), z.string()])
    .refine(val => val !== '' && val !== undefined && val !== null, 'El monto base es requerido')
    .transform(val => typeof val === 'string' ? parseFloat(val) : val)
    .pipe(z.number().positive('El monto base debe ser mayor a 0')),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  tiene_descuento: z.boolean().default(false),
  tipo_descuento: z.string().optional().nullable(),
  descuento_porcentaje: z.union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(val => (val === '' || val === undefined || val === null) ? null : typeof val === 'string' ? parseFloat(val) : val)
    .pipe(z.number().min(0).max(100).nullable()),
  descuento_monto: z.union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform(val => (val === '' || val === undefined || val === null) ? null : typeof val === 'string' ? parseFloat(val) : val)
    .pipe(z.number().min(0).nullable()),
  razon_descuento: z.string().optional().nullable(),
  cobrar_inmediato: z.boolean().optional().default(false),
  metodo_pago: z.string().optional().nullable(),
  observaciones_pago: z.string().optional().nullable(),
})

export type PagoCreateFormValues = {
  judoka_id: string
  club_id: string
  tipo_pago: string
  concepto: string
  descripcion?: string | null
  monto_base: number
  fecha_vencimiento: string
  tiene_descuento: boolean
  tipo_descuento?: string | null
  descuento_porcentaje?: number | null
  descuento_monto?: number | null
  razon_descuento?: string | null
  cobrar_inmediato?: boolean
  metodo_pago?: string | null
  observaciones_pago?: string | null
}

export function usePagoCreateForm(
  judokaId: string,
  clubId: string | undefined,
  userId: string | undefined,
  onSuccess?: () => void,
  judokaNombre?: string,
  usuarioNombre?: string
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [montoFinal, setMontoFinal] = useState(MONTO_MENSUALIDAD_DEFAULT)

  const mesActual = MESES[new Date().getMonth()]
  const anioActual = new Date().getFullYear()
  const defaultConcepto = `Mensualidad ${mesActual} ${anioActual}`
  const defaultVencimiento = dayjs().endOf('month').format('YYYY-MM-DD')

  const form = useForm<PagoCreateFormValues>({
    resolver: zodResolver(uiPagoSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      judoka_id: judokaId,
      club_id: clubId || '',
      tipo_pago: TIPO_PAGO.MENSUALIDAD,
      concepto: defaultConcepto,
      descripcion: null,
      monto_base: MONTO_MENSUALIDAD_DEFAULT,
      tiene_descuento: false,
      tipo_descuento: TIPO_DESCUENTO.MONTO_FIJO,
      descuento_porcentaje: null,
      descuento_monto: null,
      razon_descuento: RAZON_DESCUENTO.PROMOCION,
      fecha_vencimiento: defaultVencimiento,
      cobrar_inmediato: false,
      metodo_pago: 'efectivo',
      observaciones_pago: '',
    },
  })

  // Actualizar club_id si llega por lazy loading
  useEffect(() => {
    if (clubId && !form.getValues('club_id')) {
      form.setValue('club_id', clubId)
    }
  }, [clubId, form])

  const watchTipoPago = form.watch('tipo_pago')
  const watchMontoBase = form.watch('monto_base')
  const watchTieneDescuento = form.watch('tiene_descuento')
  const watchTipoDescuento = form.watch('tipo_descuento')
  const watchDescuentoPorcentaje = form.watch('descuento_porcentaje')
  const watchDescuentoMonto = form.watch('descuento_monto')

  // Si cambia a Mensualidad, auto-cargar monto fijo de 140 Bs
  useEffect(() => {
    if (watchTipoPago === TIPO_PAGO.MENSUALIDAD) {
      const currentBase = form.getValues('monto_base')
      if (!currentBase || currentBase === 0) {
        form.setValue('monto_base', MONTO_MENSUALIDAD_DEFAULT, { shouldValidate: true })
      }
      const currentConcepto = form.getValues('concepto')
      if (!currentConcepto || currentConcepto.trim() === '') {
        form.setValue('concepto', defaultConcepto, { shouldValidate: true })
      }
    }
  }, [watchTipoPago, form, defaultConcepto])

  useEffect(() => {
    let final = watchMontoBase || 0

    if (watchTieneDescuento) {
      if (watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE && watchDescuentoPorcentaje) {
        final = final - (final * (watchDescuentoPorcentaje || 0) / 100)
      } else if (watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO && watchDescuentoMonto) {
        final = final - (watchDescuentoMonto || 0)
      }
    }

    setMontoFinal(Math.max(0, final))
  }, [watchMontoBase, watchTieneDescuento, watchTipoDescuento, watchDescuentoPorcentaje, watchDescuentoMonto])

  const onSubmit = useCallback(async (
    data: PagoCreateFormValues,
    options?: { cobrarInmediato?: boolean; metodoPago?: string }
  ) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const tieneDescReal = !!data.tiene_descuento && (
        (data.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE && !!data.descuento_porcentaje && data.descuento_porcentaje > 0) ||
        (data.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && !!data.descuento_monto && data.descuento_monto > 0)
      )

      const esCobroInmediato = options?.cobrarInmediato ?? !!data.cobrar_inmediato
      const metodoPago = options?.metodoPago ?? data.metodo_pago ?? 'efectivo'
      const ahora = new Date().toISOString()

      const pagoData: any = {
        judoka_id: data.judoka_id,
        club_id: data.club_id,
        tipo_pago: data.tipo_pago,
        concepto: data.concepto,
        descripcion: data.descripcion || null,
        monto_base: data.monto_base,
        monto_final: montoFinal,
        estado: esCobroInmediato ? ESTADO_PAGO.PAGADO : ESTADO_PAGO.PENDIENTE,
        fecha_vencimiento: data.fecha_vencimiento,
        fecha_pago: esCobroInmediato ? ahora : null,
        metodo_pago: esCobroInmediato ? metodoPago : null,
        observaciones_pago: data.observaciones_pago || (esCobroInmediato ? 'Cobro inmediato en ventanilla' : null),
        creador_id: userId || '',
        pagador_id: esCobroInmediato ? (userId || null) : null,
        activo: true,
        tiene_descuento: tieneDescReal,
        tipo_descuento: tieneDescReal ? (data.tipo_descuento || TIPO_DESCUENTO.MONTO_FIJO) : TIPO_DESCUENTO.NINGUNO,
        descuento_porcentaje: tieneDescReal && data.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE ? data.descuento_porcentaje : null,
        descuento_monto: tieneDescReal && data.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO ? data.descuento_monto : null,
        razon_descuento: tieneDescReal ? (data.razon_descuento || RAZON_DESCUENTO.PROMOCION) : RAZON_DESCUENTO.NINGUNO,
      }

      const response = await pagoController.createPago(pagoData)

      if (response.success && response.data) {
        // Si fue cobro inmediato, generar automáticamente el comprobante de pago
        if (esCobroInmediato) {
          let clubNombre = ''
          if (data.club_id) {
            const clubResponse = await clubController.getClubById(data.club_id)
            if (clubResponse.success && clubResponse.data) {
              clubNombre = clubResponse.data.nombre_club
            }
          }
          try {
            generatePagoReceipt(
              response.data,
              judokaNombre || 'Futbolista',
              clubNombre,
              usuarioNombre || 'Sistema'
            )
          } catch (pdfErr) {
            console.error('Error generando comprobante PDF:', pdfErr)
          }
        }

        setSuccess(true)
        return response.data
      } else {
        setError(response.error || 'Error al crear el pago')
        return null
      }
    } catch (err) {
      console.error('Error al crear pago:', err)
      setError('Error inesperado al crear el pago')
      return null
    } finally {
      setLoading(false)
    }
  }, [montoFinal, userId, judokaNombre, usuarioNombre])

  return {
    form,
    montoFinal,
    loading,
    error,
    success,
    onSubmit,
    setError
  }
}
