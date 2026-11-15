import { z } from 'zod'
import { pagoMasivoSchema } from '@/schemas/pagoSchema'
import { useState, useEffect, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PagoCreate, TipoPago, TipoDescuento, RazonDescuento } from '@/models/pago'
import { TIPO_PAGO, ESTADO_PAGO, TIPO_DESCUENTO, RAZON_DESCUENTO, MONTO_MENSUALIDAD_DEFAULT } from '@/constants/pagos'
import { pagoController } from '@/controllers/pagoController'
import { useAuth } from '@/contexts/AuthContext'
import { Judoka } from '@/models/judoka'
import dayjs from 'dayjs'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function usePagoMasivoManager({ judokas, onSuccess }: { judokas: Judoka[], onSuccess?: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)
  const [montoFinal, setMontoFinal] = useState(MONTO_MENSUALIDAD_DEFAULT)

  const mesActual = MESES[new Date().getMonth()]
  const anioActual = new Date().getFullYear()
  const defaultConcepto = `Mensualidad ${mesActual} ${anioActual}`
  const defaultVencimiento = dayjs().endOf('month').format('YYYY-MM-DD')

  const form = useForm({
    resolver: zodResolver(pagoMasivoSchema),
    mode: 'onTouched',
    defaultValues: {
      tipo_pago: TIPO_PAGO.MENSUALIDAD as string,
      concepto: defaultConcepto,
      descripcion: '',
      monto_base: MONTO_MENSUALIDAD_DEFAULT as unknown as number,
      fecha_vencimiento: defaultVencimiento,
      tiene_descuento: false,
      tipo_descuento: TIPO_DESCUENTO.MONTO_FIJO as string,
      descuento_porcentaje: null,
      descuento_monto: null,
      razon_descuento: RAZON_DESCUENTO.PROMOCION as string,
    },
  })

  const watchTipoPago = useWatch({ control: form.control, name: 'tipo_pago' })
  const watchMontoBase = useWatch({ control: form.control, name: 'monto_base' })
  const watchTieneDescuento = useWatch({ control: form.control, name: 'tiene_descuento' })
  const watchTipoDescuento = useWatch({ control: form.control, name: 'tipo_descuento' })
  const watchDescuentoPorcentaje = useWatch({ control: form.control, name: 'descuento_porcentaje' })
  const watchDescuentoMonto = useWatch({ control: form.control, name: 'descuento_monto' })

  // Auto-cargar monto de 140 Bs si cambia a Mensualidad
  useEffect(() => {
    if (watchTipoPago === TIPO_PAGO.MENSUALIDAD) {
      const currentBase = form.getValues('monto_base')
      if (!currentBase || Number(currentBase) === 0) {
        form.setValue('monto_base', MONTO_MENSUALIDAD_DEFAULT, { shouldValidate: true })
      }
      const currentConcepto = form.getValues('concepto')
      if (!currentConcepto || currentConcepto.trim() === '') {
        form.setValue('concepto', defaultConcepto, { shouldValidate: true })
      }
    }
  }, [watchTipoPago, form, defaultConcepto])

  // Calcular monto final
  useEffect(() => {
    const base = typeof watchMontoBase === 'string' ? parseFloat(watchMontoBase.replace(',', '.')) : (watchMontoBase || 0)
    let final = isNaN(base) ? 0 : base

    if (watchTieneDescuento) {
      if (watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE && watchDescuentoPorcentaje !== null && watchDescuentoPorcentaje !== undefined) {
        const pct = typeof watchDescuentoPorcentaje === 'string' ? parseFloat(watchDescuentoPorcentaje) : watchDescuentoPorcentaje
        if (typeof pct === 'number' && !isNaN(pct)) {
          final = final - (final * pct / 100)
        }
      } else if (watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO && watchDescuentoMonto !== null && watchDescuentoMonto !== undefined) {
        const descMonto = typeof watchDescuentoMonto === 'string' ? parseFloat(watchDescuentoMonto.replace(',', '.')) : watchDescuentoMonto
        if (typeof descMonto === 'number' && !isNaN(descMonto)) {
          final = final - descMonto
        }
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

      const tieneDescReal = !!data.tiene_descuento && (
        (data.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE && !!data.descuento_porcentaje && Number(data.descuento_porcentaje) > 0) ||
        (data.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && !!data.descuento_monto && Number(data.descuento_monto) > 0)
      )

      for (const judoka of judokas) {
        const pagoData: PagoCreate = {
          judoka_id: judoka.id,
          club_id: judoka.club_id || user?.club_id || '',
          tipo_pago: data.tipo_pago as TipoPago,
          concepto: data.concepto,
          descripcion: data.descripcion || null,
          monto_base: data.monto_base,
          tiene_descuento: tieneDescReal,
          tipo_descuento: tieneDescReal ? (data.tipo_descuento as TipoDescuento || TIPO_DESCUENTO.MONTO_FIJO) : TIPO_DESCUENTO.NINGUNO,
          descuento_porcentaje: tieneDescReal && data.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE ? data.descuento_porcentaje : null,
          descuento_monto: tieneDescReal && data.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO ? data.descuento_monto : null,
          razon_descuento: tieneDescReal ? (data.razon_descuento as RazonDescuento || RAZON_DESCUENTO.PROMOCION) : RAZON_DESCUENTO.NINGUNO,
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
