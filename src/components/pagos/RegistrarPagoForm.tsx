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

interface RegistrarPagoFormProps {
  pago: Pago
  onSuccess?: () => void
  onCancel?: () => void
}

export default function RegistrarPagoForm({ pago, onSuccess, onCancel }: RegistrarPagoFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0], // Hoy por defecto
    metodo_pago: 'efectivo',
    observaciones_pago: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      const response = await pagoController.updatePago(pago.id, {
        estado: 'pagado',
        fecha_pago: formData.fecha_pago,
        metodo_pago: formData.metodo_pago,
        observaciones_pago: formData.observaciones_pago || null,
        pagado_por: user?.id || null
      })

      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1000)
      } else {
        setError(response.error || 'Error al registrar el pago')
      }
    } catch (err) {
      console.error('Error al registrar pago:', err)
      setError('Error inesperado al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Registrar pago de: <strong>{pago.concepto}</strong>
      </Typography>

      <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, mb: 2 }}>
        <Typography variant="body2">
          Monto a pagar: <strong>Bs. {pago.monto_final.toFixed(2)}</strong>
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Pago registrado exitosamente
        </Alert>
      )}

      <TextField
        fullWidth
        label="Fecha de Pago"
        name="fecha_pago"
        type="date"
        value={formData.fecha_pago}
        onChange={handleChange}
        required
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
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
          {loading ? <CircularProgress size={24} /> : 'Registrar Pago'}
        </Button>
      </Box>
    </Box>
  )
}
