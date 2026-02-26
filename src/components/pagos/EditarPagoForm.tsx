'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Pago, TipoDescuento, RazonDescuento } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { TIPO_PAGO_LABELS, TIPO_DESCUENTO, RAZON_DESCUENTO, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS } from '@/constants/pagos'

interface EditarPagoFormProps {
  pago: Pago
  onSuccess?: () => void
  onCancel?: () => void
}

export default function EditarPagoForm({ pago, onSuccess, onCancel }: EditarPagoFormProps) {
    const [formData, setFormData] = useState({
    tipo_pago: pago.tipo_pago,
    concepto: pago.concepto,
    descripcion: pago.descripcion || '',
    monto_base: pago.monto_base,
    tiene_descuento: pago.tiene_descuento,
    tipo_descuento: (pago.tipo_descuento || TIPO_DESCUENTO.NINGUNO) as TipoDescuento,
    descuento_porcentaje: pago.descuento_porcentaje,
    descuento_monto: pago.descuento_monto,
    razon_descuento: (pago.razon_descuento || RAZON_DESCUENTO.NINGUNO) as RazonDescuento,
    fecha_vencimiento: pago.fecha_vencimiento
  })
  const [montoFinal, setMontoFinal] = useState(pago.monto_final)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      [name]: value === '' ? null : parseFloat(value)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData = {
        ...formData,
        monto_final: montoFinal
      }

      const response = await pagoController.updatePago(pago.id, updateData)

      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1000)
      } else {
        setError(response.error || 'Error al actualizar el pago')
      }
    } catch (err) {
      console.error('Error al actualizar pago:', err)
      setError('Error inesperado al actualizar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Editar pago: <strong>{pago.concepto}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Pago actualizado exitosamente
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Tipo de Pago</InputLabel>
        <Select
          name="tipo_pago"
          value={formData.tipo_pago}
          onChange={handleSelectChange}
          label="Tipo de Pago"
          required
        >
          {Object.entries(TIPO_PAGO_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Concepto"
        name="concepto"
        value={formData.concepto}
        onChange={handleChange}
        required
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Descripción (opcional)"
        name="descripcion"
        value={formData.descripcion || ''}
        onChange={handleChange}
        multiline
        rows={2}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Monto Base"
        name="monto_base"
        type="number"
        value={formData.monto_base}
        onChange={handleNumberChange}
        required
        inputProps={{ min: 0, step: 0.01 }}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
        }}
      />

      <DatePicker
        label="Fecha de Vencimiento"
        value={formData.fecha_vencimiento ? dayjs(formData.fecha_vencimiento) : null}
        onChange={(newValue) => {
          setFormData(prev => ({ ...prev, fecha_vencimiento: newValue ? newValue.format('YYYY-MM-DD') : '' }))
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

      <FormControlLabel
        control={
          <Switch
            name="tiene_descuento"
            checked={formData.tiene_descuento}
            onChange={handleSwitchChange}
          />
        }
        label="Aplicar descuento"
        sx={{ mb: 2 }}
      />

      {formData.tiene_descuento && (
        <>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Descuento</InputLabel>
            <Select
              name="tipo_descuento"
              value={formData.tipo_descuento || TIPO_DESCUENTO.NINGUNO}
              onChange={handleSelectChange}
              label="Tipo de Descuento"
              required
            >
              {Object.entries(TIPO_DESCUENTO_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {formData.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE && (
            <TextField
              fullWidth
              label="Descuento (%)"
              name="descuento_porcentaje"
              type="number"
              value={formData.descuento_porcentaje || ''}
              onChange={handleNumberChange}
              required
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              sx={{ mb: 2 }}
            />
          )}

          {formData.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && (
            <TextField
              fullWidth
              label="Descuento (Monto)"
              name="descuento_monto"
              type="number"
              value={formData.descuento_monto || ''}
              onChange={handleNumberChange}
              required
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ mb: 2 }}
            />
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Razón del Descuento</InputLabel>
            <Select
              name="razon_descuento"
              value={formData.razon_descuento || RAZON_DESCUENTO.NINGUNO}
              onChange={handleSelectChange}
              label="Razón del Descuento"
            >
              {Object.entries(RAZON_DESCUENTO_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}

      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mb: 2 }}>
        <Typography variant="h6">
          Monto Final: Bs. {montoFinal.toFixed(2)}
        </Typography>
        {pago.monto_final !== montoFinal && (
          <Typography variant="caption" color="text.secondary">
            (Anterior: Bs. {pago.monto_final.toFixed(2)})
          </Typography>
        )}
      </Box>

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
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
        </Button>
      </Box>
    </Box>
  )
}
