'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm, Controller, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import Visibility from '@mui/icons-material/Visibility'

dayjs.locale('es')
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import { CARGOS_ASOCIACION } from '@/utils/constants'
import { miembroAsociacionSchema } from '@/utils/zodSchemas'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'

interface MiembroAsociacionFormProps {
  miembro?: MiembroAsociacion | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function MiembroAsociacionForm({ miembro, onSuccess, onCancel }: MiembroAsociacionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Configuración de React Hook Form con Zod
  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, submitCount },
  } = useForm({
    resolver: zodResolver(miembroAsociacionSchema),
    mode: 'onChange',
    defaultValues: {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      password: '',
      cargo: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      fecha_ingreso: null as string | null,
      activo: true,
    },
  })

  const showErrors = submitCount > 0

  const fieldError = (name: keyof typeof errors) => {
    const isFocused = focusedField === name
    return {
      error: showErrors && !!errors[name] && !isFocused,
      helperText: (showErrors && !isFocused) ? (errors[name] as { message?: string } | undefined)?.message : undefined,
    }
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof miembroAsociacionSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof miembroAsociacionSchema>)[]
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

  // Efecto para cargar datos del miembro en edición
  useEffect(() => {
    if (miembro) {
      reset({
        nombres: miembro.nombres,
        apellido_paterno: miembro.apellido_paterno ?? miembro.apellidos?.split(/\s+/)[0] ?? '',
        apellido_materno: miembro.apellido_materno ?? miembro.apellidos?.split(/\s+/).slice(1).join(' ') ?? '',
        email: miembro.email,
        cargo: miembro.cargo ?? '',
        fecha_nacimiento: miembro.fecha_nacimiento || null,
        numero_celular: miembro.numero_celular || '',
        ci: miembro.ci || '',
        genero: miembro.genero || '',
        fecha_ingreso: miembro.fecha_ingreso || null,
        activo: miembro.activo,
      })
    }
  }, [miembro, reset])

  const onSubmit = async (data: z.infer<typeof miembroAsociacionSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let response

      if (miembro) {
        const updateData: MiembroAsociacionUpdate = {
          ...data,
          cargo: data.cargo || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          numero_celular: data.numero_celular || null,
          ci: data.ci || null,
          genero: data.genero || null,
          fecha_ingreso: data.fecha_ingreso || null,
        } as MiembroAsociacionUpdate
        response = await asociacionController.updateMiembro(miembro.id, updateData)
      } else {
        const createData: MiembroAsociacionCreate = {
          ...data,
          cargo: data.cargo || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          numero_celular: data.numero_celular || null,
          ci: data.ci || null,
          genero: data.genero || null,
          fecha_ingreso: data.fecha_ingreso || null,
          activo: data.activo ?? true,
          password: data.password || '',
        } as MiembroAsociacionCreate
        response = await asociacionController.createMiembro(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el miembro')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
              onFocus={() => setFocusedField('ci')}
              onBlur={() => setFocusedField(null)}
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
              onFocus={() => setFocusedField('nombres')}
              onBlur={() => setFocusedField(null)}
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
              onFocus={() => setFocusedField('apellido_paterno')}
              onBlur={() => setFocusedField(null)}
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
              onFocus={() => setFocusedField('apellido_paterno')}
              onBlur={() => setFocusedField(null)}
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
                  onFocus: () => setFocusedField('fecha_nacimiento'),
                  onBlur: () => setFocusedField(null),
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
              onFocus={() => setFocusedField('numero_celular')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => field.onChange(formatCelularInput(e.target.value))}
            />
          )}
        />

        <FormControl fullWidth error={fieldError('genero').error}>
          <InputLabel>Género</InputLabel>
          <Controller
            name="genero"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Género"
                disabled={loading}
                onFocus={() => setFocusedField('genero')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin definir</em></MenuItem>
                <MenuItem value="Masculino">Masculino</MenuItem>
                <MenuItem value="Femenino">Femenino</MenuItem>
                <MenuItem value="Prefiero no decir">Prefiero no decir</MenuItem>
              </Select>
            )}
          />
          {fieldError('genero').helperText && <FormHelperText>{fieldError('genero').helperText}</FormHelperText>}
        </FormControl>

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
                  onFocus: () => setFocusedField('fecha_ingreso'),
                  onBlur: () => setFocusedField(null),
                },
              }}
              format="DD/MM/YYYY"
            />
          )}
        />

        <FormControl fullWidth error={fieldError('cargo').error}>
          <InputLabel>Cargo</InputLabel>
          <Controller
            name="cargo"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Cargo"
                disabled={loading}
                onFocus={() => setFocusedField('cargo')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin cargo</em></MenuItem>
                {CARGOS_ASOCIACION.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('cargo').helperText && <FormHelperText>{fieldError('cargo').helperText}</FormHelperText>}
        </FormControl>

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
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          )}
        />

        {!miembro && (
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                {...fieldError('password')}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
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
