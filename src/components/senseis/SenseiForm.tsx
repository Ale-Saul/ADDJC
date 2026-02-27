'use client'

import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Autocomplete,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Controller } from 'react-hook-form'

dayjs.locale('es')
import { Sensei } from '@/models/sensei'
import { ESPECIALIDADES_SENSEI } from '@/utils/constants'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'
import { useSenseiForm } from '@/hooks/useSenseiForm'

interface SenseiFormProps {
  sensei?: Sensei | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function SenseiForm({ sensei, onSuccess, onCancel }: SenseiFormProps) {
  const {
    state,
    dispatch,
    control,
    handleSubmit,
    onSubmit,
    onError,
    errors,
    user
  } = useSenseiForm({ sensei, onSuccess })

  const { clubes, loading, loadingClubes, error, success } = state

  const fieldError = (name: keyof typeof errors) => {
    return {
      error: !!errors[name],
      helperText: (errors[name] as { message?: string } | undefined)?.message,
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {sensei ? 'Sensei actualizado exitosamente' : 'Sensei creado exitosamente'}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Controller
          name="club_id"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={clubes.sort((a, b) => a.nombre_club.localeCompare(b.nombre_club))}
              getOptionLabel={(option) => 
                typeof option === 'string' 
                  ? clubes.find(c => c.id === option)?.nombre_club || ''
                  : option.nombre_club
              }
              isOptionEqualToValue={(option, value) => 
                typeof value === 'string' ? option.id === value : option.id === value?.id
              }
              value={clubes.find(c => c.id === field.value) || null}
              onChange={(_, newValue) => field.onChange(newValue ? newValue.id : '')}
              disabled={loading || loadingClubes || user?.rol === 'encargado'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Club"
                  error={fieldError('club_id').error}
                  helperText={fieldError('club_id').helperText}
                  placeholder="Escribe para buscar club..."
                />
              )}
              noOptionsText="No se encontraron clubes"
            />
          )}
        />
        {user?.rol === 'encargado' && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, mb: 1, ml: 1 }}>
            Los senseis se crearán automáticamente en tu club
          </Typography>
        )}

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
              options={["Femenino", "Masculino", "Prefiero no decir"]}
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
          name="grado_dan"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={["1er Dan", "2do Dan", "3er Dan", "4to Dan", "5to Dan", "6to Dan", "7mo Dan", "8vo Dan", "9no Dan", "10mo Dan"]}
              value={field.value || null}
              onChange={(_, newValue) => field.onChange(newValue || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Grado Dan"
                  error={fieldError('grado_dan').error}
                  helperText={fieldError('grado_dan').helperText}
                  placeholder="Escribe para buscar grado..."
                />
              )}
              noOptionsText="No se encontró el grado"
            />
          )}
        />

        <Controller
          name="especialidad"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={[...ESPECIALIDADES_SENSEI].sort((a, b) => a.localeCompare(b))}
              value={field.value || null}
              onChange={(_, newValue) => field.onChange(newValue || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Especialidad"
                  error={fieldError('especialidad').error}
                  helperText={fieldError('especialidad').helperText}
                  placeholder="Escribe para buscar especialidad..."
                />
              )}
              noOptionsText="No se encontró la especialidad"
            />
          )}
        />

        {!sensei && (
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
          {loading ? 'Guardando...' : sensei ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}
