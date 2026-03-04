import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { ESTADO_PAGO, METODO_PAGO } from '@/constants/pagos'

const registrarPagoSchema = z.object({
  fecha_pago: z.string().min(1, 'La fecha de pago es requerida'),
  metodo_pago: z.string().min(1, 'El método de pago es requerido'),
  observaciones_pago: z.string().optional().nullable(),
})

export function useRegistrarPagoForm(pagos: Pago[], userId: string | undefined, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(registrarPagoSchema),
    mode: 'onTouched',
    defaultValues: {
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: METODO_PAGO.EFECTIVO as string,
      observaciones_pago: '',
    },
  })

  const onSubmit = useCallback(async (data: z.infer<typeof registrarPagoSchema>) => {
    setLoading(true)
    setError(null)

    try {
      const updatePromises = pagos.map(pago => 
        pagoController.updatePago(pago.id, {
          estado: ESTADO_PAGO.PAGADO,
          fecha_pago: data.fecha_pago,
          metodo_pago: data.metodo_pago,
          observaciones_pago: data.observaciones_pago || null,
          pagador_id: userId || null
        })
      )

      const results = await Promise.all(updatePromises)
      const allSuccess = results.every(r => r.success)
      
      if (allSuccess) {
        setSuccess(true)
        if (onSuccess) setTimeout(onSuccess, 1000)
      } else {
        const failedCount = results.filter(r => !r.success).length
        setError(`Error al registrar ${failedCount} ${failedCount === 1 ? 'pago' : 'pagos'}`)
      }
    } catch (err) {
      console.error('Error al registrar pagos:', err)
      setError('Error inesperado al registrar los pagos')
    } finally {
      setLoading(false)
    }
  }, [pagos, userId, onSuccess])

  const totalPagar = pagos.reduce((sum, pago) => sum + pago.monto_final, 0)

  return {
    form,
    loading,
    error,
    success,
    totalPagar,
    onSubmit,
    setError
  }
}
