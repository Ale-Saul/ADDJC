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
  FormHelperText,
  Autocomplete,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')
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
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Configuración de React Hook Form con Zod
  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(senseiSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      club_id: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      grado_dan: '',
      especialidad: '',
      activo: true,
    },
  })

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
