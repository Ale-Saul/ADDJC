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
import { Controller } from 'react-hook-form'
import { TIPO_DESCUENTO, TIPO_PAGO_LABELS, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS } from '@/constants/pagos'
import { useEditarPagoForm } from '@/hooks/useEditarPagoForm'

const TIPO_PAGO_OPTIONS = Object.entries(TIPO_PAGO_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

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

  const watchTieneDescuento = form.watch('tiene_descuento')
  const watchTipoDescuento = form.watch('tipo_descuento')

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
        <Controller
          name="tipo_pago"
          control={form.control}
          render={({ field }) => (
            <Autocomplete
              options={TIPO_PAGO_OPTIONS}
              getOptionLabel={(opt) => opt.label}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              value={TIPO_PAGO_OPTIONS.find(o => o.value === field.value) ?? null}
              onChange={(_, v) => field.onChange(v?.value ?? '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de Pago"
                  required
                  error={!!form.formState.errors.tipo_pago}
                  helperText={form.formState.errors.tipo_pago?.message}
                  inputProps={{ ...params.inputProps, autoComplete: 'off' }}
                />
              )}
            />
          )}
        />

        <Controller
          name="concepto"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Concepto"
              required
              disabled={loading}
              error={!!form.formState.errors.concepto}
              helperText={form.formState.errors.concepto?.message}
            />
          )}
        />

        <Controller
          name="descripcion"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Descripción (opcional)"
              multiline
              rows={2}
              disabled={loading}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Controller
            name="monto_base"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Monto Base"
                type="number"
                required
                disabled={loading}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                error={!!form.formState.errors.monto_base}
                helperText={form.formState.errors.monto_base?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="fecha_vencimiento"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label="Fecha de Vencimiento"
                value={field.value ? dayjs(field.value) : null}
                onChange={(newValue) => {
                  field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!form.formState.errors.fecha_vencimiento,
                    helperText: form.formState.errors.fecha_vencimiento?.message
                  },
                }}
                format="DD/MM/YYYY"
                disabled={loading}
              />
            )}
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
            <Controller
              name="tipo_descuento"
              control={form.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Tipo de Descuento"
                  required
                  disabled={loading}
                >
                  {Object.entries(TIPO_DESCUENTO_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              {watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE && (
                <Controller
                  name="descuento_porcentaje"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descuento (%)"
                      type="number"
                      required
                      disabled={loading}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      error={!!form.formState.errors.descuento_porcentaje}
                      helperText={form.formState.errors.descuento_porcentaje?.message}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  )}
                />
              )}

              {watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO && (
                <Controller
                  name="descuento_monto"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descuento (Monto)"
                      type="number"
                      required
                      disabled={loading}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      error={!!form.formState.errors.descuento_monto}
                      helperText={form.formState.errors.descuento_monto?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                      }}
                    />
                  )}
                />
              )}

              <Controller
                name="razon_descuento"
                control={form.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Razón del Descuento"
                    disabled={loading}
                  >
                    {Object.entries(RAZON_DESCUENTO_LABELS).map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </TextField>
                )}
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
