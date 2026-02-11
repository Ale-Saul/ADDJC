'use client'

import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { useAuth } from '@/contexts/AuthContext'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'

interface RegistrarPagoFormProps {
  pagos: Pago[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function RegistrarPagoForm({ pagos, onSuccess, onCancel }: RegistrarPagoFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0], // Hoy por defecto
    metodo_pago: 'efectivo',
    observaciones_pago: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Calcular total a pagar
  const totalPagar = pagos.reduce((sum, pago) => sum + pago.monto_final, 0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    if (!name) return
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Actualizar todos los pagos seleccionados
      const updatePromises = pagos.map(pago => 
        pagoController.updatePago(pago.id, {
          estado: 'pagado',
          fecha_pago: formData.fecha_pago,
          metodo_pago: formData.metodo_pago,
          observaciones_pago: formData.observaciones_pago || null,
          pagado_por: user?.id || null
        })
      )

      const results = await Promise.all(updatePromises)
      
      // Verificar si todos fueron exitosos
      const allSuccess = results.every(r => r.success)
      
      if (allSuccess) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1000)
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
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Registrando <strong>{pagos.length}</strong> {pagos.length === 1 ? 'pago' : 'pagos'}
      </Typography>

      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mb: 2 }}>
        <Typography variant="h6" color="success.dark">
          Total a Pagar: Bs. {totalPagar.toFixed(2)}
        </Typography>
        {pagos.length > 1 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {pagos.map((p, idx) => (
              <span key={p.id}>
                {p.concepto}: Bs. {p.monto_final.toFixed(2)}
                {idx < pagos.length - 1 && ' + '}
              </span>
            ))}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {pagos.length === 1 ? 'Pago registrado' : 'Pagos registrados'} exitosamente
        </Alert>
      )}

      <DatePicker
        label="Fecha de Pago"
        value={formData.fecha_pago ? dayjs(formData.fecha_pago) : null}
        onChange={(newValue) => {
          setFormData(prev => ({ ...prev, fecha_pago: newValue ? newValue.format('YYYY-MM-DD') : '' }))
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            required: true,
            sx: { mb: 2 }
          },
        }}
        format="DD/MM/YYYY"
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Método de Pago</InputLabel>
        <Select
          name="metodo_pago"
          value={formData.metodo_pago}
          onChange={handleSelectChange}
          label="Método de Pago"
          required
        >
          <MenuItem value="efectivo">Efectivo</MenuItem>
          <MenuItem value="transferencia">Transferencia Bancaria</MenuItem>
          <MenuItem value="qr">QR/Billetera Digital</MenuItem>
          <MenuItem value="tarjeta">Tarjeta</MenuItem>
          <MenuItem value="otro">Otro</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Observaciones (opcional)"
        name="observaciones_pago"
        value={formData.observaciones_pago}
        onChange={handleChange}
        multiline
        rows={3}
        sx={{ mb: 2 }}
        placeholder="Ej: Pagó con billete de 100, se dio vuelto 40"
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="success"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : `Registrar ${pagos.length === 1 ? 'Pago' : `${pagos.length} Pagos`}`}
        </Button>
      </Box>
    </Box>
  )
}
