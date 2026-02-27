'use client'

import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Controller } from 'react-hook-form'

dayjs.locale('es')
import { MiembroAsociacion } from '@/models/asociacion'
import { CARGOS_ASOCIACION } from '@/utils/constants'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'
import { useMiembroAsociacionForm } from '@/hooks/useMiembroAsociacionForm'

interface MiembroAsociacionFormProps {
  miembro?: MiembroAsociacion | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function MiembroAsociacionForm({ miembro, onSuccess, onCancel }: MiembroAsociacionFormProps) {
  const {
    state,
    dispatch,
    control,
    handleSubmit,
    onSubmit,
    onError,
    errors
  } = useMiembroAsociacionForm({ miembro, onSuccess })

  const { loading, error, success } = state

  const fieldError = (name: keyof typeof errors) => {
    return {
      error: !!errors[name],
      helperText: (errors[name] as { message?: string } | undefined)?.message,
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {miembro ? 'Miembro actualizado exitosamente' : 'Miembro creado exitosamente'}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Controller
          name="ci"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Carnet de Identidad"
              required
              disabled={loading}
              {...fieldError('ci')}
              onChange={(e) => field.onChange(formatCIInput(e.target.value))}
            />
          )}
        />

        <Controller
          name="nombres"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nombres"
              required
              disabled={loading}
              {...fieldError('nombres')}
              onChange={(e) => field.onChange(formatNameInput(e.target.value))}
            />
          )}
        />

        <Controller
          name="apellido_paterno"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Apellido paterno"
              disabled={loading}
              {...fieldError('apellido_paterno')}
              onChange={(e) => field.onChange(formatNameInput(e.target.value))}
            />
          )}
        />

        <Controller
          name="apellido_materno"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Apellido materno"
              disabled={loading}
              error={fieldError('apellido_paterno').error}
              helperText={fieldError('apellido_paterno').error ? 'Al menos uno de los dos apellidos es requerido' : undefined}
              onChange={(e) => field.onChange(formatNameInput(e.target.value))}
            />
          )}
        />

        <Controller
          name="fecha_nacimiento"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Fecha de Nacimiento"
              value={field.value ? dayjs(field.value) : null}
              onChange={(newValue) => {
                field.onChange(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : null)
              }}
              disabled={loading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  ...fieldError('fecha_nacimiento'),
                },
              }}
              format="DD/MM/YYYY"
            />
          )}
        />

        <Controller
          name="numero_celular"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Número de Celular"
              disabled={loading}
              {...fieldError('numero_celular')}
              inputProps={{ maxLength: 8 }}
              onChange={(e) => field.onChange(formatCelularInput(e.target.value))}
            />
          )}
        />

        <Controller
          name="genero"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={["Masculino", "Femenino", "Prefiero no decir"]}
              value={field.value || null}
              onChange={(_, newValue) => field.onChange(newValue || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Género"
                  error={fieldError('genero').error}
                  helperText={fieldError('genero').helperText}
                />
              )}
            />
          )}
        />

        <Controller
          name="fecha_ingreso"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Fecha de Ingreso"
              value={field.value ? dayjs(field.value) : null}
              onChange={(newValue) => {
                field.onChange(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : null)
              }}
              disabled={loading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  ...fieldError('fecha_ingreso'),
                },
              }}
              format="DD/MM/YYYY"
            />
          )}
        />

        <Controller
          name="cargo"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={CARGOS_ASOCIACION}
              value={field.value || null}
              onChange={(_, newValue) => field.onChange(newValue || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cargo"
                  error={fieldError('cargo').error}
                  helperText={fieldError('cargo').helperText}
                  placeholder="Escribe para buscar cargo..."
                />
              )}
              noOptionsText="No se encontró el cargo"
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Email"
              type="email"
              required
              disabled={loading}
              {...fieldError('email')}
            />
          )}
        />

        {!miembro && (
          <Alert severity="info" sx={{ mt: 1 }}>
            La contraseña se generará automáticamente y se enviará por correo al usuario.
          </Alert>
        )}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : miembro ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}
