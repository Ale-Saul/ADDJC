'use client'

import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  Stack,
  Divider,
  Autocomplete
} from '@mui/material'
import { Pago } from '@/models/pago'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { Controller, useWatch } from 'react-hook-form'
import { FormInput, FormSelect, FormDatePicker, FormAutocomplete } from '@/components/ui'
import { TIPO_DESCUENTO, TIPO_PAGO_LABELS, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS } from '@/constants/pagos'
import { useEditarPagoForm } from '@/hooks/useEditarPagoForm'
import { formatNameWithNumbersInput } from '@/utils/formatters'

const TIPO_PAGO_OPTIONS = Object.entries(TIPO_PAGO_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

const TIPO_DESCUENTO_OPTIONS = Object.entries(TIPO_DESCUENTO_LABELS).map(([value, label]) => ({ value, label }))
const RAZON_DESCUENTO_OPTIONS = Object.entries(RAZON_DESCUENTO_LABELS).map(([value, label]) => ({ value, label }))

interface EditarPagoFormProps {
  pago: Pago
  onSuccess?: () => void
  onCancel?: () => void
}

export default function EditarPagoForm({ pago, onSuccess, onCancel }: EditarPagoFormProps) {
  const {
    form,
    montoFinal,
    loading,
    error,
    success,
    onSubmit,
    setError
  } = useEditarPagoForm(pago, onSuccess)

  const watchTieneDescuento = useWatch({ control: form.control, name: 'tiene_descuento' })
  const watchTipoDescuento = useWatch({ control: form.control, name: 'tipo_descuento' })

  return (
    <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        Editando pago: <strong>{pago.concepto}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Pago actualizado exitosamente
        </Alert>
      )}

      <Stack spacing={3}>
        <FormAutocomplete
          control={form.control}
          name="tipo_pago"
          label="Tipo de Pago"
          options={TIPO_PAGO_OPTIONS}
          disabled={loading}
          required
        />

        <FormInput
          control={form.control}
          name="concepto"
          label="Concepto"
          disabled={loading}
          required
          formatValue={formatNameWithNumbersInput}
        />

        <FormInput
          control={form.control}
          name="descripcion"
          label="Descripción (opcional)"
          multiline
          rows={2}
          disabled={loading}
          formatValue={formatNameWithNumbersInput}
        />

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <FormInput
            control={form.control}
            name="monto_base"
            label="Monto Base"
            type="number"
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
            }}
          />

          <FormDatePicker
            control={form.control}
            name="fecha_vencimiento"
            label="Fecha de Vencimiento"
            disabled={loading}
          />
        </Box>

        <Divider />

        <Controller
          name="tiene_descuento"
          control={form.control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Aplicar descuento"
            />
          )}
        />

        {watchTieneDescuento && (
          <Stack spacing={3} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <FormAutocomplete
              control={form.control}
              name="tipo_descuento"
              label="Tipo de Descuento"
              options={TIPO_DESCUENTO_OPTIONS}
              disabled={loading}
              required
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              {watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE && (
                <FormInput
                  control={form.control}
                  name="descuento_porcentaje"
                  label="Descuento (%)"
                  type="number"
                  disabled={loading}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              )}

              {watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO && (
                <FormInput
                  control={form.control}
                  name="descuento_monto"
                  label="Descuento (Monto)"
                  type="number"
                  disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                  }}
                />
              )}

              <FormAutocomplete
                control={form.control}
                name="razon_descuento"
                label="Razón del Descuento"
                options={RAZON_DESCUENTO_OPTIONS}
                disabled={loading}
                required
              />
            </Box>
          </Stack>
        )}

        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Monto Final: Bs. {montoFinal.toFixed(2)}
          </Typography>
          {pago.monto_final !== montoFinal && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Anterior: Bs. {pago.monto_final.toFixed(2)}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              sx={{ height: 48, px: 4 }}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ height: 48, px: 4, minWidth: 180 }}
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
