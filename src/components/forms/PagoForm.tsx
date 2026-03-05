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
  InputAdornment,
  Stack
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { PagoCreate, TipoPago, TipoDescuento, RazonDescuento, EstadoPago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { useAuth } from '@/contexts/AuthContext'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { TIPO_PAGO_LABELS, TIPO_DESCUENTO, RAZON_DESCUENTO, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS, TIPO_PAGO, ESTADO_PAGO } from '@/constants/pagos'

interface PagoFormProps {
  judokaId: string
  judokaNombre: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PagoForm({ judokaId, judokaNombre, onSuccess, onCancel }: PagoFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<PagoCreate>({
    judoka_id: judokaId,
    club_id: user?.club_id || '',
    tipo_pago: TIPO_PAGO.MENSUALIDAD as TipoPago,
    concepto: '',
    descripcion: null,
    monto_base: '' as any,
    tiene_descuento: false,
    tipo_descuento: TIPO_DESCUENTO.NINGUNO as TipoDescuento,
    descuento_porcentaje: null,
    descuento_monto: null,
    razon_descuento: RAZON_DESCUENTO.NINGUNO as RazonDescuento,
    estado: ESTADO_PAGO.PENDIENTE as EstadoPago,
    fecha_vencimiento: '',
    fecha_pago: null,
    metodo_pago: null,
    comprobante_url: null,
    creador_id: user?.id || '',
    activo: true
  })
  const [montoFinal, setMontoFinal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Calcular monto final cuando cambian los valores
  useEffect(() => {
    const montoBase = typeof formData.monto_base === 'string' ? parseFloat(formData.monto_base) || 0 : (formData.monto_base || 0)
    let final = montoBase

    if (formData.tiene_descuento) {
      if (formData.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE && formData.descuento_porcentaje !== null) {
        final = montoBase - (montoBase * (formData.descuento_porcentaje || 0) / 100)
      } else if (formData.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && formData.descuento_monto !== null) {
        final = montoBase - (formData.descuento_monto || 0)
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
      // Resetear valores de descuento si se desactiva
      ...(name === 'tiene_descuento' && !checked ? {
        tipo_descuento: TIPO_DESCUENTO.NINGUNO,
        descuento_porcentaje: null,
        descuento_monto: null,
        razon_descuento: RAZON_DESCUENTO.NINGUNO
      } : name === 'tiene_descuento' && checked ? {
        tipo_descuento: TIPO_DESCUENTO.PORCENTAJE,
        razon_descuento: RAZON_DESCUENTO.BECA,
        descuento_porcentaje: null
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
      // Agregar monto_final calculado antes de enviar
      const montoBaseFinal = typeof formData.monto_base === 'string' ? (parseFloat(formData.monto_base) || 0) : (formData.monto_base || 0)
      
      const pagoConMontoFinal = {
        ...formData,
        monto_base: montoBaseFinal,
        monto_final: montoFinal
      }

      const response = await pagoController.createPago(pagoConMontoFinal)

      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        setError(response.error || 'Error al crear el pago')
      }
    } catch (err) {
      console.error('Error al crear pago:', err)
      setError('Error inesperado al crear el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Crear pago para: <strong>{judokaNombre}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Pago creado exitosamente
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
        type="text"
        value={formData.monto_base || ''}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9.]/g, '')
          setFormData(prev => ({ ...prev, monto_base: parseFloat(val) || 0 }))
          setError(null)
          setSuccess(false)
        }}
        required
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
        <Stack spacing={3} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Descuento</InputLabel>
            <Select
              name="tipo_descuento"
              value={formData.tipo_descuento || TIPO_DESCUENTO.PORCENTAJE}
              onChange={(e) => {
                handleSelectChange(e);
                // Limpiar valores al cambiar tipo
                setFormData(prev => ({
                  ...prev,
                  descuento_porcentaje: e.target.value === TIPO_DESCUENTO.PORCENTAJE ? null : null,
                  descuento_monto: e.target.value === TIPO_DESCUENTO.MONTO_FIJO ? null : null
                }));
              }}
              label="Tipo de Descuento"
              required
            >
              {Object.entries(TIPO_DESCUENTO_LABELS)
                .filter(([value]) => value !== TIPO_DESCUENTO.NINGUNO)
                .map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            {(formData.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE || !formData.tipo_descuento || formData.tipo_descuento === 'ninguno') && (
              <TextField
                fullWidth
                label="Descuento (%)"
                name="descuento_porcentaje"
                type="number"
                value={formData.descuento_porcentaje ?? ''}
                onChange={handleNumberChange}
                required
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            )}

            {formData.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && (
              <TextField
                fullWidth
                label="Descuento (Monto)"
                name="descuento_monto"
                type="number"
                value={formData.descuento_monto ?? ''}
                onChange={handleNumberChange}
                required
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                }}
              />
            )}

            <FormControl fullWidth>
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
          </Box>
        </Stack>
      )}

      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mb: 2 }}>
        <Typography variant="h6">
          Monto Final: Bs. {montoFinal.toFixed(2)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
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
          {loading ? <CircularProgress size={24} /> : 'Crear Pago'}
        </Button>
      </Box>
    </Box>
  )
}
