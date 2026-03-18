import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PagoCreate, TipoPago, TipoDescuento, RazonDescuento } from '@/models/pago'
import { TIPO_PAGO, ESTADO_PAGO, TIPO_DESCUENTO, RAZON_DESCUENTO } from '@/constants/pagos'
import { pagoController } from '@/controllers/pagoController'
import { useAuth } from '@/contexts/AuthContext'
import { Judoka } from '@/models/judoka'

const pagoMasivoSchema = z.object({
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

export function usePagoMasivoManager({ judokas, onSuccess }: { judokas: Judoka[], onSuccess?: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)
  const [montoFinal, setMontoFinal] = useState(0)

  const form = useForm({
    resolver: zodResolver(pagoMasivoSchema),
    mode: 'onTouched',
    defaultValues: {
      tipo_pago: TIPO_PAGO.MENSUALIDAD as string,
      concepto: '',
      descripcion: '',
      monto_base: '' as unknown as number,
      fecha_vencimiento: '',
      tiene_descuento: false,
      tipo_descuento: TIPO_DESCUENTO.NINGUNO as string,
      descuento_porcentaje: null,
      descuento_monto: null,
      razon_descuento: RAZON_DESCUENTO.NINGUNO as string,
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
      if (watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE && watchDescuentoPorcentaje !== null) {
        final = final - (final * (watchDescuentoPorcentaje || 0) / 100)
      } else if (watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO && watchDescuentoMonto !== null) {
        final = final - (watchDescuentoMonto || 0)
      }
    }

    setMontoFinal(Math.max(0, final))
  }, [watchMontoBase, watchTieneDescuento, watchTipoDescuento, watchDescuentoPorcentaje, watchDescuentoMonto])

  const onSubmit = useCallback(async (data: z.infer<typeof pagoMasivoSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setCreatedCount(0)

    try {
      let successCount = 0
      let errorCount = 0

      for (const judoka of judokas) {
        const pagoData: PagoCreate = {
          judoka_id: judoka.id,
          club_id: judoka.club_id || user?.club_id || '',
          tipo_pago: data.tipo_pago as TipoPago,
          concepto: data.concepto,
          descripcion: data.descripcion || null,
          monto_base: data.monto_base,
          tiene_descuento: data.tiene_descuento,
          tipo_descuento: data.tipo_descuento as TipoDescuento,
          descuento_porcentaje: data.descuento_porcentaje,
          descuento_monto: data.descuento_monto,
          razon_descuento: data.razon_descuento as RazonDescuento,
          monto_final: montoFinal,
          estado: ESTADO_PAGO.PENDIENTE,
          fecha_vencimiento: data.fecha_vencimiento,
          creador_id: user?.id || ''
        }

        const response = await pagoController.createPago(pagoData)
        if (response.success) {
          successCount++
          setCreatedCount(successCount)
        } else {
          errorCount++
        }
      }

      if (errorCount > 0) {
        setError(`Se crearon ${successCount} pagos correctamente y ${errorCount} fallaron`)
      } else {
        setSuccess(true)
        if (onSuccess) setTimeout(onSuccess, 1500)
      }
    } catch (err) {
      console.error('Error al crear pagos masivos:', err)
      setError('Error inesperado al crear los pagos')
    } finally {
      setLoading(false)
    }
  }, [judokas, user, montoFinal, onSuccess])

  return {
    form,
    montoFinal,
    loading,
    error,
    success,
    createdCount,
    onSubmit,
    setError,
    watchTieneDescuento,
    watchTipoDescuento,
  }
}
