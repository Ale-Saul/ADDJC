'use client'

import { z } from 'zod'
import { useState } from 'react'
import { Controller } from 'react-hook-form'
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
import { type FieldErrors } from 'react-hook-form'
import { Club } from '@/models/club'
import { MUNICIPIOS } from '@/utils/constants'
import { clubSchema } from '@/utils/zodSchemas'
import { useClubForm } from '@/hooks/useClubForm'
import { formatCIInput, formatNameInput } from '@/utils/inputMasks'

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
    setFocus,
    trigger
  } = useClubForm({ club, onSuccess })

  const {
    senseis,
    newDirector,
    loading,
    loadingSenseis,
    error,
    success,
    isCreatingNewDirector
  } = state

  const [directorErrors, setDirectorErrors] = useState<{ ci: string; nombres: string; apellido_paterno: string; email: string }>({
    ci: '', nombres: '', apellido_paterno: '', email: ''
  })

  const nameRegex = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/

  const validateDirectorField = (field: 'ci' | 'nombres' | 'apellido_paterno' | 'email', value: string, apellidoMaterno?: string) => {
    if (field === 'ci') {
      if (value.trim() === '') return 'El CI es requerido'
      if (!/^\d{1,7}(-[A-Za-z]{1,3})?$/.test(value.trim())) return 'Formato inválido (ej: 1234567-CB)'
      return ''
    }
    if (field === 'nombres') {
      if (value.trim() === '') return 'Los nombres son requeridos'
      if (!nameRegex.test(value)) return 'Solo se permiten letras y espacios'
      return ''
    }
    if (field === 'apellido_paterno') {
      const materno = (apellidoMaterno ?? '').trim()
      if (value.trim() === '' && materno === '') return 'Al menos uno de los dos apellidos es requerido'
      if (value.trim() !== '' && !nameRegex.test(value)) return 'Solo se permiten letras y espacios'
      return ''
    }
    if (field === 'email') {
      if (value.trim() === '') return 'El email es requerido'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'El formato del email no es válido'
      return ''
    }
    return ''
  }

  const handleDirectorBlur = (field: 'ci' | 'nombres' | 'apellido_paterno' | 'email') => {
    const value = field === 'apellido_paterno' ? newDirector.apellidoPaterno : newDirector[field as keyof typeof newDirector]
    const errMsg = validateDirectorField(field, value as string, newDirector.apellidoMaterno)
    setDirectorErrors(prev => ({ ...prev, [field]: errMsg }))
  }

  const handleDirectorChange = (field: 'ci' | 'nombres' | 'apellido_paterno' | 'email', value: string) => {
    if (directorErrors[field]) {
      const mat = field === 'apellido_paterno' ? newDirector.apellidoMaterno : undefined
      const errMsg = validateDirectorField(field, value, mat)
      setDirectorErrors(prev => ({ ...prev, [field]: errMsg }))
    }
  }

  const fieldError = (name: keyof typeof errors) => ({
    error: !!errors[name],
    helperText: (errors[name] as { message?: string } | undefined)?.message,
  })

  const onError = (formErrors: FieldErrors<z.infer<typeof clubSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof clubSchema>)[]
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0]
      setFocus(firstField, { shouldSelect: true })
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{club ? 'Actualizado' : 'Creado'} exitosamente</Alert>}

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
              onChange={(e) => { field.onChange(e); if (errors.nombre_club) trigger('nombre_club') }}
              onBlur={() => { field.onBlur(); trigger('nombre_club') }}
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
              noOptionsText="No se encontró el municipio"
              loadingText="Cargando..."
              value={field.value || null}
              onChange={(_, v) => { field.onChange(v || ''); if (errors.provincia) trigger('provincia') }}
              disabled={loading}
              renderInput={(params) => (
                <TextField {...params} label="Municipio" required {...fieldError('provincia')} placeholder="Buscar municipio..." />
              )}
            />
          )}
        />

        <Controller
          name="direccion"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Dirección" multiline rows={3} disabled={loading} {...fieldError('direccion')} />
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
              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
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
                    options={senseis}
                    getOptionLabel={(option) => 
                      typeof option === 'string' 
                        ? (senseis.find(s => s.id === option)?.nombres + ' ' + (senseis.find(s => s.id === option)?.apellidos || '')).trim()
                        : (option.nombres + ' ' + (option.apellidos || '')).trim() + (option.grado_dan ? ` - ${option.grado_dan}` : '')
                    }
                    value={senseis.find(s => s.id === field.value) || null}
                    onChange={(_, v) => field.onChange(v ? v.id : null)}
                    disabled={loading || loadingSenseis}
                    noOptionsText="No se encontraron resultados"
                    loadingText="Cargando..."
                    renderInput={(params) => (
                      <TextField {...params} label="Director Técnico" {...fieldError('director_tecnico_id')} placeholder="Buscar..." />
                    )}
                  />
                )}
              />
              {!club && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => dispatch({ type: 'SET_IS_CREATING_NEW_DIRECTOR', payload: true })} disabled={loading} sx={{ alignSelf: 'flex-start' }}>
                  Crear Nuevo Director Técnico
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Nuevo Director Técnico</Typography>
                <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => dispatch({ type: 'SET_IS_CREATING_NEW_DIRECTOR', payload: false })} disabled={loading}>
                  Seleccionar Existente
                </Button>
              </Box>
              <TextField 
                fullWidth 
                label="CI" 
                value={newDirector.ci} 
                onChange={(e) => { const v = formatCIInput(e.target.value); dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'ci', value: v }); handleDirectorChange('ci', v) }} 
                onBlur={() => handleDirectorBlur('ci')}
                error={!!directorErrors.ci}
                helperText={directorErrors.ci}
                disabled={loading} 
                required 
              />
              <TextField 
                fullWidth 
                label="Nombres" 
                value={newDirector.nombres} 
                onChange={(e) => { const v = formatNameInput(e.target.value); dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'nombres', value: v }); handleDirectorChange('nombres', v) }} 
                onBlur={() => handleDirectorBlur('nombres')}
                error={!!directorErrors.nombres}
                helperText={directorErrors.nombres}
                disabled={loading} 
                required 
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  fullWidth 
                  label="Ap. Paterno" 
                  value={newDirector.apellidoPaterno} 
                  onChange={(e) => { const v = formatNameInput(e.target.value); dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'apellidoPaterno', value: v }); handleDirectorChange('apellido_paterno', v) }} 
                  onBlur={() => handleDirectorBlur('apellido_paterno')}
                  error={!!directorErrors.apellido_paterno}
                  helperText={directorErrors.apellido_paterno}
                  disabled={loading} 
                />
                <TextField 
                  fullWidth 
                  label="Ap. Materno" 
                  value={newDirector.apellidoMaterno} 
                  onChange={(e) => { const v = formatNameInput(e.target.value); dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'apellidoMaterno', value: v }); if (directorErrors.apellido_paterno) handleDirectorChange('apellido_paterno', newDirector.apellidoPaterno) }} 
                  disabled={loading} 
                />
              </Box>
              <TextField fullWidth label="Email" type="email" value={newDirector.email} onChange={(e) => { dispatch({ type: 'SET_NEW_DIRECTOR_FIELD', field: 'email', value: e.target.value }); handleDirectorChange('email', e.target.value) }} onBlur={() => handleDirectorBlur('email')} error={!!directorErrors.email} helperText={directorErrors.email} disabled={loading} required />
              <Alert severity="info">Se registrará como encargado automáticamente.</Alert>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && <Button variant="outlined" onClick={onCancel} disabled={loading}>Cancelar</Button>}
        <Button type="submit" variant="contained" disabled={loading} sx={{ height: '40px', minWidth: '120px' }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : (club ? 'Actualizar' : 'Crear')}
        </Button>
      </Box>
    </Box>
  )
}
