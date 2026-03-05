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
import { Judoka } from '@/models/judoka'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { Controller } from 'react-hook-form'
import { TIPO_DESCUENTO, TIPO_PAGO_LABELS, TIPO_DESCUENTO_LABELS, RAZON_DESCUENTO_LABELS } from '@/constants/pagos'
import { usePagoMasivoManager } from '@/hooks/usePagoMasivoManager'

const TIPO_PAGO_OPTIONS = Object.entries(TIPO_PAGO_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

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
    watchTieneDescuento,
    watchTipoDescuento,
  } = usePagoMasivoManager({ judokas, onSuccess })

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
              placeholder="Ej: Mensualidad Marzo 2024"
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
                type="text"
                required
                disabled={loading}
                value={field.value === 0 ? '' : field.value}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  field.onChange(val === '' ? 0 : parseFloat(val))
                }}
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
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    // Limpiar los valores de descuento al cambiar el tipo
                    if (e.target.value === TIPO_DESCUENTO.PORCENTAJE) {
                      form.setValue('descuento_monto', null);
                    } else if (e.target.value === TIPO_DESCUENTO.MONTO_FIJO) {
                      form.setValue('descuento_porcentaje', null);
                    }
                  }}
                >
                  {Object.entries(TIPO_DESCUENTO_LABELS)
                    .filter(([value]) => value !== 'ninguno')
                    .map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                </TextField>
              )}
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              {(watchTipoDescuento === TIPO_DESCUENTO.PORCENTAJE || !watchTipoDescuento || watchTipoDescuento === 'ninguno') && (
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
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
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
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
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
