'use client'

import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { Pago } from '@/models/pago'
import { useAuth } from '@/contexts/AuthContext'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { Controller } from 'react-hook-form'
import { METODO_PAGO_LABELS } from '@/constants/pagos'
import { useRegistrarPagoForm } from '@/hooks/useRegistrarPagoForm'

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
        <Controller
          name="fecha_pago"
          control={form.control}
          render={({ field }) => (
            <DatePicker
              label="Fecha de Pago"
              value={field.value ? dayjs(field.value) : null}
              onChange={(newValue) => {
                field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!form.formState.errors.fecha_pago,
                  helperText: form.formState.errors.fecha_pago?.message
                },
              }}
              format="DD/MM/YYYY"
              disabled={loading}
            />
          )}
        />

        <Controller
          name="metodo_pago"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              fullWidth
              label="Método de Pago"
              required
              disabled={loading}
              error={!!form.formState.errors.metodo_pago}
              helperText={form.formState.errors.metodo_pago?.message}
            >
              {Object.entries(METODO_PAGO_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
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
