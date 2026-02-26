import { useState, useEffect } from 'react'
import type { SelectChangeEvent } from '@mui/material/Select'
import { PagoCreate, TipoPago, TipoDescuento, RazonDescuento } from '@/models/pago'
import { TIPO_PAGO, ESTADO_PAGO, TIPO_DESCUENTO, RAZON_DESCUENTO } from '@/constants/pagos'
import { pagoController } from '@/controllers/pagoController'
import { useAuth } from '@/contexts/AuthContext'
import { Judoka } from '@/models/judoka'

interface UsePagoMasivoProps {
  judokas: Judoka[]
  onSuccess?: () => void
}

export function usePagoMasivo({ judokas, onSuccess }: UsePagoMasivoProps) {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    tipo_pago: TIPO_PAGO.MENSUALIDAD as TipoPago,
    concepto: '',
    descripcion: '',
    monto_base: '' as any,
    tiene_descuento: false,
    tipo_descuento: TIPO_DESCUENTO.NINGUNO as TipoDescuento,
    descuento_porcentaje: null as number | null,
    descuento_monto: null as number | null,
    razon_descuento: RAZON_DESCUENTO.NINGUNO as RazonDescuento | null,
    fecha_vencimiento: ''
  })
  
  const [montoFinal, setMontoFinal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)

  // Calcular monto final
  useEffect(() => {
    const montoBase = typeof formData.monto_base === 'string' ? parseFloat(formData.monto_base) || 0 : formData.monto_base
    let final = montoBase

    if (formData.tiene_descuento) {
      if (formData.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE && formData.descuento_porcentaje) {
        final = montoBase - (montoBase * formData.descuento_porcentaje / 100)
      } else if (formData.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && formData.descuento_monto) {
        final = montoBase - formData.descuento_monto
      }
    }

    setMontoFinal(Math.max(0, final))
  }, [formData.monto_base, formData.tiene_descuento, formData.tipo_descuento, formData.descuento_porcentaje, formData.descuento_monto])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value)
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    if (!name) return
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked,
      ...(name === 'tiene_descuento' && !checked ? {
        tipo_descuento: TIPO_DESCUENTO.NINGUNO,
        descuento_porcentaje: null,
        descuento_monto: null,
        razon_descuento: RAZON_DESCUENTO.NINGUNO
      } : name === 'tiene_descuento' && checked ? {
        tipo_descuento: TIPO_DESCUENTO.PORCENTAJE,
        razon_descuento: RAZON_DESCUENTO.BECA
      } : {})
    }))
    setError(null)
    setSuccess(false)
  }

  const setFechaVencimiento = (fecha: string) => {
    setFormData(prev => ({ ...prev, fecha_vencimiento: fecha }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setCreatedCount(0)

    try {
      let successCount = 0
      let errorCount = 0

      // Crear un pago para cada judoka
      for (const judoka of judokas) {
        const pagoData: PagoCreate = {
          judoka_id: judoka.id,
          club_id: user?.club_id || '',
          tipo_pago: formData.tipo_pago,
          concepto: formData.concepto,
          descripcion: formData.descripcion || null,
          monto_base: typeof formData.monto_base === 'string' ? parseFloat(formData.monto_base) : formData.monto_base,
          tiene_descuento: formData.tiene_descuento,
          tipo_descuento: formData.tipo_descuento,
          descuento_porcentaje: formData.descuento_porcentaje,
          descuento_monto: formData.descuento_monto,
          razon_descuento: formData.razon_descuento,
          monto_final: montoFinal,
          estado: ESTADO_PAGO.PENDIENTE,
          fecha_vencimiento: formData.fecha_vencimiento,
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
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      }
    } catch (err) {
      console.error('Error al crear pagos masivos:', err)
      setError('Error inesperado al crear los pagos')
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    montoFinal,
    loading,
    error,
    success,
    createdCount,
    handleChange,
    handleNumberChange,
    handleSelectChange,
    handleSwitchChange,
    setFechaVencimiento,
    handleSubmit
  }
}
