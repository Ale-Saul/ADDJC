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
  FormControlLabel
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { PagoCreate } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { useAuth } from '@/contexts/AuthContext'
import { Judoka } from '@/models/judoka'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'

interface PagoMasivoFormProps {
  judokas: Judoka[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PagoMasivoForm({ judokas, onSuccess, onCancel }: PagoMasivoFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    tipo_pago: 'cuota_mensual',
    concepto: '',
    descripcion: '',
    monto_base: '' as any,
    tiene_descuento: false,
    tipo_descuento: null as 'porcentaje' | 'monto' | null,
    descuento_porcentaje: null as number | null,
    descuento_monto: null as number | null,
    razon_descuento: null as string | null,
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
      if (formData.tipo_descuento === 'porcentaje' && formData.descuento_porcentaje) {
        final = montoBase - (montoBase * formData.descuento_porcentaje / 100)
      } else if (formData.tipo_descuento === 'monto' && formData.descuento_monto) {
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
        tipo_descuento: null,
        descuento_porcentaje: null,
        descuento_monto: null,
        razon_descuento: null
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
    setCreatedCount(0)

    try {
      let successCount = 0
      let errorCount = 0

      // Crear un pago para cada judoka
      for (const judoka of judokas) {
        const pagoData: PagoCreate = {
          judoka_id: judoka.id,
          club_id: user?.club_id || '',
          tipo_pago: formData.tipo_pago as any,
          concepto: formData.concepto,
          descripcion: formData.descripcion || null,
          monto_base: typeof formData.monto_base === 'string' ? parseFloat(formData.monto_base) : formData.monto_base,
          tiene_descuento: formData.tiene_descuento,
          tipo_descuento: formData.tipo_descuento,
          descuento_porcentaje: formData.descuento_porcentaje,
          descuento_monto: formData.descuento_monto,
          razon_descuento: formData.razon_descuento as any,
          monto_final: montoFinal,
          estado: 'pendiente',
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

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Crear pago para <strong>{judokas.length} judokas</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {createdCount} pagos creados exitosamente
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Creando pagos... {createdCount} de {judokas.length}
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
          <MenuItem value="cuota_mensual">Cuota Mensual</MenuItem>
          <MenuItem value="cuota_traje">Cuota Traje</MenuItem>
          <MenuItem value="inscripcion">Inscripción</MenuItem>
          <MenuItem value="examen_grado">Examen de Grado</MenuItem>
          <MenuItem value="evento">Evento</MenuItem>
          <MenuItem value="otro">Otro</MenuItem>
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
        placeholder="Ej: Cuota Diciembre 2024"
      />

      <TextField
        fullWidth
        label="Descripción (opcional)"
        name="descripcion"
        value={formData.descripcion}
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
        placeholder="Ej: 100.00"
        sx={{ mb: 2 }}
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
              value={formData.tipo_descuento || ''}
              onChange={handleSelectChange}
              label="Tipo de Descuento"
              required
            >
              <MenuItem value="porcentaje">Porcentaje (%)</MenuItem>
              <MenuItem value="monto">Monto Fijo</MenuItem>
            </Select>
          </FormControl>

          {formData.tipo_descuento === 'porcentaje' && (
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

          {formData.tipo_descuento === 'monto' && (
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
              value={formData.razon_descuento || ''}
              onChange={handleSelectChange}
              label="Razón del Descuento"
            >
              <MenuItem value="beca">Beca</MenuItem>
              <MenuItem value="descuento_hermanos">Descuento Hermanos</MenuItem>
              <MenuItem value="descuento_especial">Descuento Especial</MenuItem>
              <MenuItem value="promocion">Promoción</MenuItem>
              <MenuItem value="ayuda_social">Ayuda Social</MenuItem>
              <MenuItem value="ninguna">Ninguna</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mb: 2 }}>
        <Typography variant="h6">
          Monto Final por Judoka: Bs. {montoFinal.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total a cobrar: Bs. {(montoFinal * judokas.length).toFixed(2)}
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
          {loading ? <CircularProgress size={24} /> : `Crear ${judokas.length} Pagos`}
        </Button>
      </Box>
    </Box>
  )
}
