'use client'

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
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { TIPO_PAGO_LABELS, TIPO_DESCUENTO, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS } from '@/constants/pagos'
import { usePagoForm } from '@/hooks/usePagoForm'

interface PagoFormProps {
  judokaId: string
  judokaNombre: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PagoForm({ judokaId, judokaNombre, onSuccess, onCancel }: PagoFormProps) {
  const { state, dispatch, montoFinal, handleSubmit } = usePagoForm({ judokaId, onSuccess })
  const { formData, loading, error, success } = state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    dispatch({ type: 'SET_FIELD', field: name as any, value: value === '' ? null : value })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch({ type: 'SET_FIELD', field: name as any, value: value === '' ? 0 : parseFloat(value) })
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    if (!name) return
    dispatch({ type: 'SET_FIELD', field: name as any, value: value === '' ? null : value })
  }

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    dispatch({ type: 'SET_FIELD', field: name as any, value: checked })
    if (name === 'tiene_descuento') {
      if (!checked) dispatch({ type: 'RESET_DISCOUNT' })
      else dispatch({ type: 'INIT_DISCOUNT' })
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Crear pago para: <strong>{judokaNombre}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}>
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
          dispatch({ type: 'SET_FIELD', field: 'fecha_vencimiento', value: newValue ? newValue.format('YYYY-MM-DD') : '' })
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
              value={formData.tipo_descuento || TIPO_DESCUENTO.PORCENTAJE}
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
              value={formData.razon_descuento || ''}
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
