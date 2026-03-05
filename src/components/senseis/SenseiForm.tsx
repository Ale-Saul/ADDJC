'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Controller, type FieldErrors } from 'react-hook-form'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Autocomplete,
  Chip,
  Paper,
} from '@mui/material'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import PersonRemoveAlt1Icon from '@mui/icons-material/PersonRemoveAlt1'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')
import { Sensei } from '@/models/sensei'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'
import { ESPECIALIDADES_SENSEI } from '@/utils/constants'
import { senseiSchema } from '@/utils/zodSchemas'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'
import { useSenseiForm } from '@/hooks/useSenseiForm'

interface SenseiFormProps {
  sensei?: Sensei | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function SenseiForm({ sensei, onSuccess, onCancel }: SenseiFormProps) {
  const { user } = useAuth()
  const { form, clubes, loading, loadingClubes, error, success, setError, onSubmit } = useSenseiForm(sensei, user || undefined, onSuccess)
  const { control, handleSubmit, setFocus, trigger, setValue, formState: { errors } } = form

  const isEncargado = user?.rol === ROL.ENCARGADO
  const isEditing = !!sensei

  // Local state to drive panel switching reliably (independent of watch/Autocomplete)
  const [inMyClub, setInMyClub] = useState<boolean>(
    !!sensei?.club_id && sensei.club_id === user?.club_id
  )
  const senseiHasNoClub = isEditing && !inMyClub
  const senseiInMyClub = isEditing && inMyClub

  const fieldError = (name: keyof typeof errors) => {
    return {
      error: !!errors[name],
      helperText: (errors[name] as { message?: string } | undefined)?.message,
    }
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof senseiSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof senseiSchema>)[]
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0]
      setFocus(firstField, { shouldSelect: true })
      setTimeout(() => {
        const element = document.getElementsByName(firstField)[0]
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
              onChange={(_, newValue) => {
                field.onChange(newValue ? newValue.id : '')
              }}
              disabled={loading || loadingClubes || user?.rol === ROL.ENCARGADO}
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
              loadingText="Cargando..."
            />
          )}
        />
        {user?.rol === ROL.ENCARGADO && (isEditing ? null : (
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, mb: 1, ml: 1 }}>
            Los senseis se crearán automáticamente en tu club
          </Typography>
        ))}
        {isEncargado && isEditing && senseiHasNoClub && user?.club_id && (
          <Paper
            variant="outlined"
            sx={{
              mt: -1,
              mb: 1,
              px: 2,
              py: 1.2,
              borderRadius: 2,
              borderColor: 'primary.light',
              bgcolor: 'primary.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Este sensei no pertenece a ningún club
            </Typography>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<PersonAddAlt1Icon fontSize="small" />}
              onClick={() => { setValue('club_id', user.club_id!, { shouldDirty: true }); setInMyClub(true) }}
              sx={{ textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap', ml: 2 }}
            >
              Inscribir en {user.club_nombre || 'mi club'}
            </Button>
          </Paper>
        )}
        {isEncargado && senseiInMyClub && (
          <Paper
            variant="outlined"
            sx={{
              mt: -1,
              mb: 1,
              px: 2,
              py: 1.2,
              borderRadius: 2,
              borderColor: 'error.light',
              bgcolor: 'error.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={user?.club_nombre || 'Mi club'} color="primary" size="small" sx={{ fontWeight: 500 }} />
              <Typography variant="body2" color="text.secondary">
                inscrito en tu club
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<PersonRemoveAlt1Icon fontSize="small" />}
              onClick={() => { setValue('club_id', '', { shouldDirty: true }); setInMyClub(false) }}
              sx={{ textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap', ml: 2 }}
            >
              Quitar del club
            </Button>
          </Paper>
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
              onChange={(e) => { field.onChange(formatCIInput(e.target.value)); if (errors.ci) trigger('ci') }}
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
              onChange={(e) => { field.onChange(formatNameInput(e.target.value)); if (errors.nombres) trigger('nombres') }}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="apellido_paterno"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Apellido Paterno"
                disabled={loading}
                {...fieldError('apellido_paterno')}
                onChange={(e) => { field.onChange(formatNameInput(e.target.value)); if (errors.apellido_paterno) trigger('apellido_paterno'); if (errors.apellido_materno) trigger('apellido_materno') }}
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
                label="Apellido Materno"
                disabled={loading}
                {...fieldError('apellido_materno')}
                onChange={(e) => { field.onChange(formatNameInput(e.target.value)); if (errors.apellido_paterno) trigger('apellido_paterno'); if (errors.apellido_materno) trigger('apellido_materno') }}
              />
            )}
          />
        </Box>

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
              autoComplete="off"
              onChange={(e) => { field.onChange(e.target.value); if (errors.email) trigger('email') }}
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
                const clamped = newValue?.isValid() && newValue.year() > dayjs().year() ? newValue.year(dayjs().year()) : newValue
                field.onChange(clamped?.isValid() ? clamped.format('YYYY-MM-DD') : null)
                if (errors.fecha_nacimiento) trigger('fecha_nacimiento')
              }}
              disabled={loading}
              maxDate={dayjs().endOf('year')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  ...fieldError('fecha_nacimiento'),
                  onBlur: () => trigger('fecha_nacimiento'),
                },
              }}
              format="DD/MM/YYYY"
            />
          )}
        />

<Controller name="numero_celular" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Celular" disabled={loading} {...fieldError('numero_celular')} inputProps={{ maxLength: 8, autoComplete: 'tel' }} onChange={(e) => { field.onChange(formatCelularInput(e.target.value)); if (errors.numero_celular) trigger('numero_celular') }} />
        )} />

        <Controller
          name="genero"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={["Femenino", "Masculino", "Prefiero no decir"]}
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
              noOptionsText="No se encontraron opciones"
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
              onChange={(_, newValue) => {
                field.onChange(newValue || '')
              }}
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
              loadingText="Cargando..."
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
              onChange={(_, newValue) => {
                field.onChange(newValue || '')
              }}
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
              loadingText="Cargando..."
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
          sx={{ height: '48px', minWidth: '120px' }}
        >
          {loading ? 'Guardando...' : sensei ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}
