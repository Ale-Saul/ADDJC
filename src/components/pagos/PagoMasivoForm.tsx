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
} from '@mui/material'
import { Judoka } from '@/models/judoka'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { Controller, useWatch } from 'react-hook-form'
import { FormInput, FormSelect, FormDatePicker, FormAutocomplete } from '@/components/ui'
import { formatNameWithNumbersInput } from '@/utils/formatters'
import { TIPO_DESCUENTO, TIPO_PAGO_LABELS, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS } from '@/constants/pagos'
import { usePagoMasivoManager } from '@/hooks/usePagoMasivoManager'

const TIPO_PAGO_OPTIONS = Object.entries(TIPO_PAGO_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

const TIPO_DESCUENTO_OPTIONS = Object.entries(TIPO_DESCUENTO_LABELS)
  .filter(([value]) => value !== 'ninguno')
  .map(([value, label]) => ({ value, label }))

const RAZON_DESCUENTO_OPTIONS = Object.entries(RAZON_DESCUENTO_LABELS)
  .map(([value, label]) => ({ value, label }))

interface PagoMasivoFormProps {
  judokas: Judoka[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PagoMasivoForm({ judokas, onSuccess, onCancel }: PagoMasivoFormProps) {
  const {
    form,
    montoFinal,
    loading,
    error,
    success,
    createdCount,
    onSubmit,
    setError,
  } = usePagoMasivoManager({ judokas, onSuccess })

  const watchTieneDescuento = useWatch({ control: form.control, name: 'tiene_descuento' })
  const watchTipoDescuento = useWatch({ control: form.control, name: 'tipo_descuento' })

  return (
    <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        Crear pago para <strong>{judokas.length} judokas</strong> seleccionados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {createdCount} pagos creados exitosamente
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Creando pagos... {createdCount} de {judokas.length}
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

        <Divider />

        <Controller
          name="tiene_descuento"
          control={form.control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.checked)
                    if (e.target.checked) {
                      form.setValue('tipo_descuento', 'porcentaje')
                      form.setValue('descuento_porcentaje', null)
                      form.setValue('descuento_monto', null)
                    } else {
                      form.setValue('tipo_descuento', 'ninguno')
                      form.setValue('descuento_porcentaje', null)
                      form.setValue('descuento_monto', null)
                    }
                  }}
                  disabled={loading}
                />
              }
              label="Aplicar descuento a todos"
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

        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Monto Final por Judoka: Bs. {montoFinal.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Total a generar: Bs. {(montoFinal * judokas.length).toFixed(2)} para {judokas.length} judokas
          </Typography>
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
            sx={{ height: 48, px: 4, minWidth: 200 }}
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
          >
            {loading ? 'Procesando...' : `Crear ${judokas.length} Pagos`}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
