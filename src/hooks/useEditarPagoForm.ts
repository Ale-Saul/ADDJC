import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pago, TipoDescuento, RazonDescuento } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { TIPO_DESCUENTO, RAZON_DESCUENTO } from '@/constants/pagos'

const editarPagoSchema = z.object({
  tipo_pago: z.string().min(1, 'El tipo de pago es requerido'),
  concepto: z.string().min(1, 'El concepto es requerido'),
  descripcion: z.string().optional().nullable(),
  monto_base: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  tiene_descuento: z.boolean().default(false),
  tipo_descuento: z.string().optional().nullable(),
  descuento_porcentaje: z.number().min(0).max(100).optional().nullable(),
  descuento_monto: z.number().min(0).optional().nullable(),
  razon_descuento: z.string().optional().nullable(),
})

export function useEditarPagoForm(pago: Pago, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [montoFinal, setMontoFinal] = useState(pago.monto_final)

  const form = useForm({
    resolver: zodResolver(editarPagoSchema),
    mode: 'onTouched',
    defaultValues: {
      tipo_pago: pago.tipo_pago,
      concepto: pago.concepto,
      descripcion: pago.descripcion || '',
      monto_base: pago.monto_base,
      fecha_vencimiento: pago.fecha_vencimiento,
      tiene_descuento: pago.tiene_descuento,
      tipo_descuento: pago.tipo_descuento || TIPO_DESCUENTO.NINGUNO,
      descuento_porcentaje: pago.descuento_porcentaje,
      descuento_monto: pago.descuento_monto,
      razon_descuento: pago.razon_descuento || RAZON_DESCUENTO.NINGUNO,
    },
  })

  const watchMontoBase = form.watch('monto_base')
  const watchTieneDescuento = form.watch('tiene_descuento')
  const watchTipoDescuento = form.watch('tipo_descuento')
  const watchDescuentoPorcentaje = form.watch('descuento_porcentaje')
  const watchDescuentoMonto = form.watch('descuento_monto')

  // Calcular monto final
  useEffect(() => {
    let final = watchMontoBase || 0

    if (watchTieneDescuento) {
      if (watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE && watchDescuentoPorcentaje) {
        final = final - (final * watchDescuentoPorcentaje / 100)
      } else if (watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO && watchDescuentoMonto) {
        final = final - watchDescuentoMonto
      }
    }

    setMontoFinal(Math.max(0, final))
  }, [watchMontoBase, watchTieneDescuento, watchTipoDescuento, watchDescuentoPorcentaje, watchDescuentoMonto])

  const onSubmit = useCallback(async (data: z.infer<typeof editarPagoSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await pagoController.updatePago(pago.id, {
        ...data,
        monto_final: montoFinal,
        tipo_descuento: data.tipo_descuento as TipoDescuento,
        razon_descuento: data.razon_descuento as RazonDescuento
      })

      if (response.success) {
        setSuccess(true)
        if (onSuccess) setTimeout(onSuccess, 1000)
      } else {
        setError(response.error || 'Error al actualizar el pago')
      }
    } catch (err) {
      console.error('Error al actualizar pago:', err)
      setError('Error inesperado al actualizar el pago')
    } finally {
      setLoading(false)
    }
  }, [pago.id, montoFinal, onSuccess])

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
