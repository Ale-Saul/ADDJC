import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { pagoController } from '@/controllers/pagoController'
import { ESTADO_PAGO, RAZON_DESCUENTO, TIPO_DESCUENTO, TIPO_PAGO } from '@/constants/pagos'
import { generatePagoReceipt } from '@/utils/receiptGenerator'
import { clubController } from '@/controllers/clubController'

// Un pequeño schema adaptado a los strings del formulario
const uiPagoSchema = z.object({
  judoka_id: z.string().min(1, 'El ID del judoka es requerido'),
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
})

export type PagoCreateFormValues = z.infer<typeof uiPagoSchema>

export function usePagoCreateForm(judokaId: string, clubId: string | undefined, userId: string | undefined, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [montoFinal, setMontoFinal] = useState(0)

  const form = useForm<PagoCreateFormValues>({
    resolver: zodResolver(uiPagoSchema),
    mode: 'onTouched',
      defaultValues: {
        judoka_id: judokaId,
        club_id: clubId || '',
        tipo_pago: TIPO_PAGO.MENSUALIDAD,
        concepto: '',
        descripcion: null,
        monto_base: '' as any,
        tiene_descuento: false,
        tipo_descuento: TIPO_DESCUENTO.NINGUNO,
        descuento_porcentaje: null,
        descuento_monto: null,
        razon_descuento: RAZON_DESCUENTO.NINGUNO,
        fecha_vencimiento: '',
      },
  })

  // Actualizar club_id si llega por lazy loading
  useEffect(() => {
    if (clubId && !form.getValues('club_id')) {
      form.setValue('club_id', clubId)
    }
  }, [clubId, form])

  const watchMontoBase = form.watch('monto_base')
  const watchTieneDescuento = form.watch('tiene_descuento')
  const watchTipoDescuento = form.watch('tipo_descuento')
  const watchDescuentoPorcentaje = form.watch('descuento_porcentaje')
  const watchDescuentoMonto = form.watch('descuento_monto')

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

  const onSubmit = useCallback(async (data: PagoCreateFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const pagoData = {
        ...data,
        monto_final: montoFinal,
        estado: ESTADO_PAGO.PENDIENTE as any,
        creador_id: userId || '',
        activo: true,
        tipo_pago: data.tipo_pago as any,
        tipo_descuento: data.tipo_descuento as any,
        razon_descuento: data.razon_descuento as any
      }

      const response = await pagoController.createPago(pagoData as any)

      if (response.success && response.data) {
        // Generar el comprobante de pago automáticamente
        let clubNombre = ''
        if (data.club_id) {
          const clubResponse = await clubController.getClubById(data.club_id)
          if (clubResponse.success && clubResponse.data) {
            clubNombre = clubResponse.data.nombre_club
          }
        }
        
        // El nombre del judoka lo pasamos desde el componente
        // pero aquí necesitamos una forma de obtenerlo si no lo tenemos.
        // Por ahora, asumimos que el componente lo manejará o lo pasamos como prop.
        
        setSuccess(true)
        return response.data // Retornamos el pago creado para que el componente pueda usarlo
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
  }, [montoFinal, userId])

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
