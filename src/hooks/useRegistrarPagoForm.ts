import { registrarPagoSchema } from '@/schemas/pagoSchema'
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { ESTADO_PAGO, METODO_PAGO } from '@/constants/pagos'
import { generatePagoReceipt } from '@/utils/receiptGenerator'
import { clubController } from '@/controllers/clubController'

export function useRegistrarPagoForm(pagos: Pago[], userId: string | undefined, onSuccess?: () => void, judokaNombre?: string, usuarioNombre?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(registrarPagoSchema),
    mode: 'onTouched',
    defaultValues: {
      metodo_pago: METODO_PAGO.EFECTIVO as string,
      observaciones_pago: '',
    },
  })

  const onSubmit = useCallback(async (data: z.infer<typeof registrarPagoSchema>) => {
    setLoading(true)
    setError(null)

    try {
      const fechaPago = new Date().toISOString()
      const updatePromises = pagos.map(pago => 
        pagoController.updatePago(pago.id, {
          estado: ESTADO_PAGO.PAGADO,
          fecha_pago: fechaPago,
          metodo_pago: data.metodo_pago,
          observaciones_pago: data.observaciones_pago || null,
          pagador_id: userId || null
        })
      )

      const results = await Promise.all(updatePromises)
      const allSuccess = results.every(r => r.success)
      
      if (allSuccess) {
        // Obtener datos del club (asumiendo que todos los pagos son del mismo club o usamos el primero)
        let clubNombre = ''
        const primerPago = results[0].data
        if (primerPago && primerPago.club_id) {
          const clubRes = await clubController.getClubById(primerPago.club_id)
          if (clubRes.success && clubRes.data) {
            clubNombre = clubRes.data.nombre_club
          }
        }

        // Generar un único comprobante con todos los pagos registrados
        const pagosRegistrados = results.map(r => r.data).filter(Boolean) as Pago[]
        generatePagoReceipt(pagosRegistrados, judokaNombre || 'Judoka', clubNombre, usuarioNombre || 'Sistema')

        setSuccess(true)
        if (onSuccess) setTimeout(onSuccess, 1500)
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
  }, [pagos, userId, onSuccess, judokaNombre, usuarioNombre])

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
