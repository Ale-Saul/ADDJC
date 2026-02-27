'use client'

import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Autocomplete,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Controller } from 'react-hook-form'

dayjs.locale('es')
import { Judoka } from '@/models/judoka'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'
import { CATEGORIES, BELT_COLORS } from '@/utils/constants'
import { useJudokaForm } from '@/hooks/useJudokaForm'

interface JudokaFormProps {
  judoka?: Judoka | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function JudokaForm({ judoka, onSuccess, onCancel }: JudokaFormProps) {
  const {
    state,
    control,
    handleSubmit,
    onSubmit,
    onError,
    errors,
    watchClubId,
    sortedClubes,
    sortedSenseis,
    user,
    dispatch
  } = useJudokaForm({ judoka, onSuccess })

  const { loading, loadingClubes, loadingSenseis, error, success } = state

  const fieldError = (name: keyof typeof errors) => {
    return {
      error: !!errors[name],
      helperText: (errors[name] as { message?: string } | undefined)?.message,
    }
  }

  const generos = ["Masculino", "Femenino", "Prefiero no decir"].sort((a, b) => a.localeCompare(b))
  const categorias = [...CATEGORIES]
  const cinturones = [...BELT_COLORS]

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {judoka ? 'Judoka actualizado exitosamente' : 'Judoka creado exitosamente'}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Controller
          name="club_id"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={sortedClubes}
              getOptionLabel={(option) => 
                typeof option === 'string' 
                  ? sortedClubes.find(c => c.id === option)?.nombre_club || ''
                  : option.nombre_club
              }
              isOptionEqualToValue={(option, value) => 
                typeof value === 'string' ? option.id === value : option.id === value?.id
              }
              value={sortedClubes.find(c => c.id === field.value) || null}
              onChange={(_, newValue) => {
                field.onChange(newValue ? newValue.id : '')
              }}
              disabled={loading || loadingClubes || user?.rol === 'sensei' || user?.rol === 'encargado'}
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
        {(user?.rol === 'sensei' || user?.rol === 'encargado') && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, mb: 1, ml: 1 }}>
            Los judokas se crearán automáticamente en tu club
          </Typography>
        )}

        <Controller
          name="entrenador_id"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={sortedSenseis}
              getOptionLabel={(option) => 
                typeof option === 'string' 
                  ? (sortedSenseis.find(s => s.id === option)?.nombres + ' ' + (sortedSenseis.find(s => s.id === option)?.apellidos || '')).trim()
                  : (option.nombres + ' ' + (option.apellidos || '')).trim()
              }
              isOptionEqualToValue={(option, value) => 
                typeof value === 'string' ? option.id === value : option.id === value?.id
              }
              value={sortedSenseis.find(s => s.id === field.value) || null}
              onChange={(_, newValue) => {
                field.onChange(newValue ? newValue.id : '')
              }}
              disabled={loading || loadingSenseis || !watchClubId || user?.rol === 'sensei'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Entrenador"
                  error={fieldError('entrenador_id').error}
                  helperText={fieldError('entrenador_id').helperText}
                  placeholder={!watchClubId ? "Selecciona un club primero" : "Escribe para buscar entrenador..."}
                />
              )}
              noOptionsText="No se encontraron entrenadores"
            />
          )}
        />
        {user?.rol === 'sensei' ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, mb: 1, ml: 1 }}>
            Serás asignado automáticamente como entrenador
          </Typography>
        ) : !watchClubId && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, mb: 1, ml: 1 }}>
            Selecciona un club primero para ver los entrenadores disponibles
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
              required={!judoka}
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
              options={generos}
              value={field.value || null}
              onChange={(_, newValue) => {
                field.onChange(newValue || '')
              }}
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
          name="categoria"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={categorias}
              value={field.value || null}
              onChange={(_, newValue) => {
                field.onChange(newValue || '')
              }}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoría"
                  error={fieldError('categoria').error}
                  helperText={fieldError('categoria').helperText}
                />
              )}
            />
          )}
        />

        <Controller
          name="cinturon_actual"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={cinturones}
              value={field.value || null}
              onChange={(_, newValue) => {
                field.onChange(newValue || '')
              }}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cinturón Actual"
                  error={fieldError('cinturon_actual').error}
                  helperText={fieldError('cinturon_actual').helperText}
                />
              )}
            />
          )}
        />

        {!judoka && (
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
          {loading ? 'Guardando...' : judoka ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}
