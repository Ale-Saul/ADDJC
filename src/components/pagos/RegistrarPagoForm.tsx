'use client'

import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { Pago } from '@/models/pago'
import { useAuth } from '@/contexts/AuthContext'
import { FormInput, FormAutocomplete } from '@/components/ui'
import dayjs from 'dayjs'
import { METODO_PAGO_LABELS } from '@/constants/pagos'
import { useRegistrarPagoForm } from '@/hooks/useRegistrarPagoForm'
import { formatNameWithNumbersInput } from '@/utils/formatters'

const METODO_PAGO_OPTIONS = Object.entries(METODO_PAGO_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

interface RegistrarPagoFormProps {
  pagos: Pago[]
  judokaNombre: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function RegistrarPagoForm({ pagos, judokaNombre, onSuccess, onCancel }: RegistrarPagoFormProps) {
  const { user } = useAuth()
  const usuarioNombre = user ? `${user.nombres} ${user.apellidos}` : 'Sistema'
  
  const {
    form,
    loading,
    error,
    success,
    totalPagar,
    onSubmit,
    setError
  } = useRegistrarPagoForm(pagos, user?.id, onSuccess, judokaNombre, usuarioNombre)

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

        <FormAutocomplete
          control={form.control}
          name="metodo_pago"
          label="Método de Pago"
          options={METODO_PAGO_OPTIONS}
          disabled={loading}
          required
        />

        <FormInput
          control={form.control}
          name="observaciones_pago"
          label="Observaciones (opcional)"
          multiline
          rows={3}
          disabled={loading}
          placeholder="Ej: Pago realizado por transferencia bancaria..."
          formatValue={formatNameWithNumbersInput}
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
