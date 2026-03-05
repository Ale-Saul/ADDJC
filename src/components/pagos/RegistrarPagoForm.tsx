'use client'

import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Typography,
  Autocomplete,
} from '@mui/material'
import { Pago } from '@/models/pago'
import { useAuth } from '@/contexts/AuthContext'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { METODO_PAGO_LABELS } from '@/constants/pagos'
import { useRegistrarPagoForm } from '@/hooks/useRegistrarPagoForm'

const METODO_PAGO_OPTIONS = Object.entries(METODO_PAGO_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

interface RegistrarPagoFormProps {
  pagos: Pago[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function RegistrarPagoForm({ pagos, onSuccess, onCancel }: RegistrarPagoFormProps) {
  const { user } = useAuth()
  const {
    form,
    loading,
    error,
    success,
    totalPagar,
    onSubmit,
    setError
  } = useRegistrarPagoForm(pagos, user?.id, onSuccess)

  return (
    <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Registrando <strong>{pagos.length}</strong> {pagos.length === 1 ? 'pago' : 'pagos'}
      </Typography>

      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'success.main' }}>
        <Typography variant="h5" color="success.dark" fontWeight="bold">
          Total a Pagar: Bs. {totalPagar.toFixed(2)}
        </Typography>
        {pagos.length > 1 && (
          <Typography variant="caption" color="success.dark" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
            {pagos.map((p, idx) => (
              <span key={p.id}>
                {p.concepto} (Bs. {p.monto_final.toFixed(2)})
                {idx < pagos.length - 1 && ' + '}
              </span>
            ))}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {pagos.length === 1 ? 'Pago registrado' : 'Pagos registrados'} exitosamente
        </Alert>
      )}

      <Stack spacing={3}>
        <TextField
          label="Fecha de Pago"
          value={dayjs().format('DD/MM/YYYY HH:mm')}
          fullWidth
          disabled
          helperText="Se registra automáticamente con la fecha y hora actual"
        />

        <Controller
          name="metodo_pago"
          control={form.control}
          render={({ field }) => (
            <Autocomplete
              options={METODO_PAGO_OPTIONS}
              getOptionLabel={(opt) => opt.label}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              value={METODO_PAGO_OPTIONS.find(o => o.value === field.value) ?? null}
              onChange={(_, v) => field.onChange(v?.value ?? '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Método de Pago"
                  required
                  error={!!form.formState.errors.metodo_pago}
                  helperText={form.formState.errors.metodo_pago?.message}
                  inputProps={{ ...params.inputProps, autoComplete: 'off' }}
                />
              )}
            />
          )}
        />

        <Controller
          name="observaciones_pago"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Observaciones (opcional)"
              multiline
              rows={3}
              disabled={loading}
              placeholder="Ej: Pago realizado por transferencia bancaria..."
            />
          )}
        />

        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
            color="success"
            disabled={loading}
            sx={{ height: 48, px: 4, minWidth: 180 }}
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
          >
            {loading ? 'Registrando...' : `Registrar ${pagos.length === 1 ? 'Pago' : `${pagos.length} Pagos`}`}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
