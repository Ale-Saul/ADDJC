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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  InputAdornment,
  IconButton,
  FormHelperText,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import Visibility from '@mui/icons-material/Visibility'

dayjs.locale('es')
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'
import { useAuth } from '@/contexts/AuthContext'
import { ESPECIALIDADES_SENSEI } from '@/utils/constants'
import { senseiSchema } from '@/utils/zodSchemas'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'

interface SenseiFormProps {
  sensei?: Sensei | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function SenseiForm({ sensei, onSuccess, onCancel }: SenseiFormProps) {
  const { user } = useAuth()
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
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
    resolver: zodResolver(senseiSchema),
    mode: 'onChange',
    defaultValues: {
      club_id: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      password: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      grado_dan: '',
      especialidad: '',
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

  useEffect(() => {
    const loadClubes = async () => {
      const response = await clubController.getAllClubes(false)
      if (response.success && response.data) {
        setClubes(response.data)
      }
      setLoadingClubes(false)
    }
    loadClubes()
  }, [])

  useEffect(() => {
    if (sensei) {
      const s = sensei as Sensei
      const apParts = s.apellidos?.trim().split(/\s+/) ?? []
      reset({
        club_id: s.club_id || '',
        nombres: s.nombres,
        apellido_paterno: s.apellido_paterno ?? apParts[0] ?? '',
        apellido_materno: s.apellido_materno ?? apParts.slice(1).join(' ') ?? '',
        email: s.email || '',
        fecha_nacimiento: s.fecha_nacimiento || null,
        numero_celular: s.numero_celular || '',
        ci: s.ci || '',
        genero: s.genero || '',
        grado_dan: s.grado_dan || '',
        especialidad: s.especialidad || '',
        activo: s.activo,
      })
    }
  }, [sensei, reset])

  // Si es un encargado creando un nuevo sensei, pre-completar el club
  useEffect(() => {
    if (!sensei && user?.rol === 'encargado' && user.club_id) {
      reset(prev => ({
        ...prev,
        club_id: user.club_id!
      }))
    }
  }, [sensei, user, reset])

  const onSubmit = async (data: z.infer<typeof senseiSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let response
      
      const payload = {
        ...data,
        club_id: data.club_id || null,
        apellido_paterno: data.apellido_paterno?.trim() || null,
        apellido_materno: data.apellido_materno?.trim() || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        numero_celular: data.numero_celular || null,
        ci: data.ci || null,
        genero: data.genero || null,
        grado_dan: data.grado_dan || null,
        especialidad: data.especialidad || null,
      }

      if (sensei) {
        response = await senseiController.updateSensei(sensei.id, payload as SenseiUpdate)
      } else {
        const createData: SenseiCreate = {
          ...(payload as SenseiCreate),
          usuario_id: 'temp-user-id',
          password: data.password || '',
        }
        response = await senseiController.createSensei(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el sensei')
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
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
        <FormControl fullWidth error={fieldError('club_id').error}>
          <InputLabel>Club</InputLabel>
          <Controller
            name="club_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Club"
                disabled={loading || loadingClubes || user?.rol === 'encargado'}
                onFocus={() => setFocusedField('club_id')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin club</em></MenuItem>
                {[...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club)).map((club) => (
                  <MenuItem key={club.id} value={club.id}>{club.nombre_club}</MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('club_id').helperText && <FormHelperText>{fieldError('club_id').helperText}</FormHelperText>}
          {user?.rol === 'encargado' && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Los senseis se crearán automáticamente en tu club
            </Typography>
          )}
        </FormControl>

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

        {!sensei && (
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
                <MenuItem value="Femenino">Femenino</MenuItem>
                <MenuItem value="Masculino">Masculino</MenuItem>
                <MenuItem value="Prefiero no decir">Prefiero no decir</MenuItem>
              </Select>
            )}
          />
          {fieldError('genero').helperText && <FormHelperText>{fieldError('genero').helperText}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={fieldError('grado_dan').error}>
          <InputLabel>Grado Dan</InputLabel>
          <Controller
            name="grado_dan"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Grado Dan"
                disabled={loading}
                onFocus={() => setFocusedField('grado_dan')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin definir</em></MenuItem>
                <MenuItem value="1er Dan">1er Dan</MenuItem>
                <MenuItem value="2do Dan">2do Dan</MenuItem>
                <MenuItem value="3er Dan">3er Dan</MenuItem>
                <MenuItem value="4to Dan">4to Dan</MenuItem>
                <MenuItem value="5to Dan">5to Dan</MenuItem>
                <MenuItem value="6to Dan">6to Dan</MenuItem>
                <MenuItem value="7mo Dan">7mo Dan</MenuItem>
                <MenuItem value="8vo Dan">8vo Dan</MenuItem>
                <MenuItem value="9no Dan">9no Dan</MenuItem>
                <MenuItem value="10mo Dan">10mo Dan</MenuItem>
              </Select>
            )}
          />
          {fieldError('grado_dan').helperText && <FormHelperText>{fieldError('grado_dan').helperText}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={fieldError('especialidad').error}>
          <InputLabel>Especialidad</InputLabel>
          <Controller
            name="especialidad"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Especialidad"
                disabled={loading}
                onFocus={() => setFocusedField('especialidad')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin definir</em></MenuItem>
                {[...ESPECIALIDADES_SENSEI].sort((a, b) => a.localeCompare(b)).map(esp => (
                  <MenuItem key={esp} value={esp}>{esp}</MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('especialidad').helperText && <FormHelperText>{fieldError('especialidad').helperText}</FormHelperText>}
        </FormControl>
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
