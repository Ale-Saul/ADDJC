'use client'

import {
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  Stack
} from '@mui/material'
import { Controller, useWatch } from 'react-hook-form'
import { formatCIInput, formatCIExtensionInput, formatNameInput, formatCelularInput, formatNameWithNumbersInput } from '@/utils/formatters'
import { FormInput, FormSelect, FormDatePicker, FormAutocomplete } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { usePagoCreateForm } from '@/hooks/usePagoCreateForm'
import { TIPO_PAGO_LABELS, TIPO_DESCUENTO, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS } from '@/constants/pagos'

interface PagoFormProps {
  judokaId: string
  judokaNombre: string
  clubId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const TIPO_PAGO_OPTIONS = Object.entries(TIPO_PAGO_LABELS).map(([value, label]) => ({ value, label }))
const TIPO_DESCUENTO_OPTIONS = Object.entries(TIPO_DESCUENTO_LABELS)
  .filter(([value]) => value !== 'ninguno')
  .map(([value, label]) => ({ value, label }))
const RAZON_DESCUENTO_OPTIONS = Object.entries(RAZON_DESCUENTO_LABELS).map(([value, label]) => ({ value, label }))

export default function PagoForm({ judokaId, judokaNombre, clubId, onSuccess, onCancel }: PagoFormProps) {
  const { user } = useAuth()
  
  const {
    form,
    montoFinal,
    loading,
    error,
    success,
    onSubmit,
    setError
  } = usePagoCreateForm(judokaId, clubId, user?.id, onSuccess)

  const watchTieneDescuento = useWatch({ control: form.control, name: 'tiene_descuento' })
  const watchTipoDescuento = useWatch({ control: form.control, name: 'tipo_descuento' })

  const handleFormSubmit = async (data: any) => {
    const pago = await onSubmit(data)
    if (pago) {
      // Ejecutar el callback de éxito después de una pequeña pausa
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
    }
  }

  return (
    <Box component="form" onSubmit={form.handleSubmit(handleFormSubmit)} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Crear pago para: <strong>{judokaNombre}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Pago creado exitosamente
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
            required
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

        <Controller
          name="tiene_descuento"
          control={form.control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={!!field.value}
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
              onChange={(e, newValue) => {
                const value = newValue?.value as string;
                form.setValue('tipo_descuento', value);
                if (value === TIPO_DESCUENTO.PORCENTAJE) {
                  form.setValue('descuento_monto', null);
                } else if (value === TIPO_DESCUENTO.MONTO_FIJO) {
                  form.setValue('descuento_porcentaje', null);
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              {(watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE || !watchTipoDescuento || watchTipoDescuento === 'ninguno') && (
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

        <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
          <Typography variant="h6">
            Monto Final: Bs. {montoFinal.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Creando...' : 'Crear Pago'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
