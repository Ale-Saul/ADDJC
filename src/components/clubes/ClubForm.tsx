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
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Controller } from 'react-hook-form'
import { Club } from '@/models/club'
import { MUNICIPIOS } from '@/utils/constants'
import { useClubForm } from '@/hooks/useClubForm'

interface ClubFormProps {
  club?: Club | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ClubForm({ club, onSuccess, onCancel }: ClubFormProps) {
  const {
    state,
    dispatch,
    control,
    handleSubmit,
    onSubmit,
    errors,
    reset
  } = useClubForm({ club, onSuccess })

  const { senseis, newDirector, loading, loadingSenseis, error, success, isCreatingNewDirector } = state

  const fieldError = (name: keyof typeof errors) => {
    return {
      error: !!errors[name],
      helperText: (errors[name] as { message?: string } | undefined)?.message,
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {club ? 'Club actualizado exitosamente' : 'Club creado exitosamente'}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Controller
          name="nombre_club"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nombre del Club"
              required
              disabled={loading}
              {...fieldError('nombre_club')}
            />
          )}
        />

        <Controller
          name="provincia"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={MUNICIPIOS}
              value={field.value || null}
              onChange={(_, newValue) => field.onChange(newValue || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Municipio"
                  required
                  error={fieldError('provincia').error}
                  helperText={fieldError('provincia').helperText}
                  placeholder="Escribe para buscar municipio..."
                />
              )}
              noOptionsText="No se encontró el municipio"
            />
          )}
        />

        <Controller
          name="direccion"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Dirección"
              multiline
              rows={3}
              disabled={loading}
              {...fieldError('direccion')}
            />
          )}
        />

        <Controller
          name="telefono_contacto"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Teléfono de Contacto"
              disabled={loading}
              {...fieldError('telefono_contacto')}
              inputProps={{ maxLength: 8 }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                field.onChange(val)
              }}
            />
          )}
        />

        <Box sx={{ mt: 1 }}>
          {!isCreatingNewDirector ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="director_tecnico_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={senseis.sort((a, b) => {
                      const nameA = (a.nombres + ' ' + (a.apellidos || '')).trim()
                      const nameB = (b.nombres + ' ' + (b.apellidos || '')).trim()
                      return nameA.localeCompare(nameB)
                    })}
                    getOptionLabel={(option) => 
                      typeof option === 'string' 
                        ? (senseis.find(s => s.id === option)?.nombres + ' ' + (senseis.find(s => s.id === option)?.apellidos || '')).trim()
                        : (option.nombres + ' ' + (option.apellidos || '')).trim() + (option.grado_dan ? ` - ${option.grado_dan}` : '')
                    }
                    isOptionEqualToValue={(option, value) => 
                      typeof value === 'string' ? option.id === value : option.id === value?.id
                    }
                    value={senseis.find(s => s.id === field.value) || null}
                    onChange={(_, newValue) => field.onChange(newValue ? newValue.id : null)}
                    disabled={loading || loadingSenseis}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Director Técnico"
                        error={fieldError('director_tecnico_id').error}
                        helperText={fieldError('director_tecnico_id').helperText}
                        placeholder="Escribe para buscar..."
                      />
                    )}
                    noOptionsText="No se encontraron senseis"
                  />
                )}
              />
              {!club && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    dispatch({ type: 'SET_IS_CREATING_NEW_DIRECTOR', payload: true })
                    reset(prev => ({ ...prev, director_tecnico_id: null }))
                  }}
                  disabled={loading}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Crear Nuevo Director Técnico
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Nuevo Director Técnico
                </Typography>
                <Button
                  size="small"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    dispatch({ type: 'SET_IS_CREATING_NEW_DIRECTOR', payload: false })
                    dispatch({ type: 'RESET_NEW_DIRECTOR' })
                  }}
                  disabled={loading}
                >
                  Seleccionar Existente
                </Button>
              </Box>

              <TextField
                fullWidth
                label="Carnet de Identidad"
                value={newDirector.ci}
                onChange={(e) => dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'ci', value: e.target.value })}
                disabled={loading}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Nombre del Director Técnico"
                value={newDirector.nombres}
                onChange={(e) => dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'nombres', value: e.target.value })}
                disabled={loading}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Apellido Paterno del Director Técnico"
                value={newDirector.apellidoPaterno}
                onChange={(e) => dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'apellidoPaterno', value: e.target.value })}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Apellido Materno del Director Técnico"
                value={newDirector.apellidoMaterno}
                onChange={(e) => dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'apellidoMaterno', value: e.target.value })}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Email del Director Técnico"
                type="email"
                value={newDirector.email}
                onChange={(e) => dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'email', value: e.target.value })}
                disabled={loading}
                required
              />

              <Alert severity="info" sx={{ mt: 1 }}>
                La contraseña se generará automáticamente y se enviará por correo al usuario. El director técnico se registrará como encargado automáticamente.
              </Alert>
            </Box>
          )}
        </Box>
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
          {loading ? 'Guardando...' : club ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}
