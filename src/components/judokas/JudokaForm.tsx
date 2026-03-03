'use client'

import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { useForm, Controller, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Autocomplete,
  Stack,
  InputAdornment,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { Club } from '@/models/club'
import { Sensei } from '@/models/sensei'
import { useAuth } from '@/contexts/AuthContext'
import { judokaSchema } from '@/utils/zodSchemas'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'
import { CATEGORIES, BELT_COLORS } from '@/utils/constants'

interface JudokaFormProps {
  judoka?: Judoka | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function JudokaForm({ judoka, onSuccess, onCancel }: JudokaFormProps) {
  const { user } = useAuth()
  const [clubes, setClubes] = useState<Club[]>([])
  const [senseis, setSenseis] = useState<Sensei[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
  const [loadingSenseis, setLoadingSenseis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Configuración de React Hook Form con Zod
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(judokaSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      club_id: '',
      entrenador_id: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      categoria: '',
      cinturon_actual: '',
      activo: true,
    },
  })

  const watchClubId = watch('club_id')

  const fieldError = (name: keyof typeof errors) => {
    return {
      error: !!errors[name],
      helperText: (errors[name] as { message?: string } | undefined)?.message,
    }
  }

  const onError = useCallback((formErrors: FieldErrors<z.infer<typeof judokaSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof judokaSchema>)[]
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
  }, [setFocus])

  // Opciones ordenadas
  const sortedClubes = [...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club))
  const sortedSenseis = [...senseis].sort((a, b) => {
    const nameA = (a.nombres + ' ' + (a.apellidos || '')).trim()
    const nameB = (b.nombres + ' ' + (b.apellidos || '')).trim()
    return nameA.localeCompare(nameB)
  })
  const generos = ["Masculino", "Femenino", "Prefiero no decir"]
  const categorias = [...CATEGORIES]
  const cinturones = [...BELT_COLORS]

  // Mapa de colores para los cinturones
  const beltColorMap: Record<string, string> = {
    'Blanco': '#FFFFFF',
    'Amarillo': '#FFEB3B',
    'Naranja': '#FF9800',
    'Verde': '#4CAF50',
    'Azul': '#2196F3',
    'Café': '#795548',
    'Negro': '#212121',
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

  // Cargar senseis cuando se selecciona un club
  useEffect(() => {
    const loadSenseis = async () => {
      if (watchClubId) {
        setLoadingSenseis(true)
        const response = await senseiController.getSenseisByClub(watchClubId)
        if (response.success && response.data) {
          setSenseis(response.data)
        } else {
          setSenseis([])
        }
        setLoadingSenseis(false)
      } else {
        setSenseis([])
      }
    }
    loadSenseis()
  }, [watchClubId])

  useEffect(() => {
    if (judoka) {
      reset({
        club_id: judoka.club_id || '',
        entrenador_id: judoka.entrenador_id || '',
        nombres: judoka.nombres || '',
        apellido_paterno: judoka.apellido_paterno ?? judoka.apellidos?.trim().split(/\s+/)[0] ?? '',
        apellido_materno: judoka.apellido_materno ?? judoka.apellidos?.trim().split(/\s+/).slice(1).join(' ') ?? '',
        email: judoka.email || '',
        fecha_nacimiento: judoka.fecha_nacimiento || null,
        numero_celular: judoka.numero_celular || '',
        ci: judoka.ci || '',
        genero: judoka.genero || '',
        categoria: judoka.categoria || '',
        cinturon_actual: judoka.cinturon_actual || '',
        activo: judoka.activo,
      })
    }
  }, [judoka, reset])

  // Pre-completar club si es sensei o encargado
  useEffect(() => {
    if (!judoka && user && user.club_id) {
      if (user.rol === 'sensei') {
        reset(prev => ({
          ...prev,
          club_id: user.club_id!,
          entrenador_id: user.sensei_id || ''
        }))
      } else if (user.rol === 'encargado') {
        reset(prev => ({
          ...prev,
          club_id: user.club_id!
        }))
      }
    }
  }, [judoka, user, reset])

  const onSubmit = async (data: z.infer<typeof judokaSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let response
      
      const payload = {
        ...data,
        club_id: data.club_id || null,
        entrenador_id: data.entrenador_id || null,
        apellido_paterno: data.apellido_paterno?.trim() || null,
        apellido_materno: data.apellido_materno?.trim() || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        numero_celular: data.numero_celular || null,
        genero: data.genero || null,
        categoria: data.categoria || null,
        cinturon_actual: data.cinturon_actual || null,
      }

      if (judoka) {
        response = await judokaController.updateJudoka(judoka.id, payload as JudokaUpdate)
      } else {
        // En creación el usuario_id será manejado por el controlador/servicio
        response = await judokaController.createJudoka(payload as JudokaCreate)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 500)
        }
      } else {
        setError(response.error || 'Error al guardar el judoka')
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
          {judoka ? 'Judoka actualizado exitosamente' : 'Judoka creado exitosamente'}
        </Alert>
      )}

      <Stack spacing={2}>
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
              loadingText="Cargando clubes..."
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
              loadingText="Cargando entrenadores..."
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
                label="Apellido Materno"
                disabled={loading}
                error={fieldError('apellido_paterno').error}
                helperText={fieldError('apellido_paterno').error ? 'Al menos uno de los dos apellidos es requerido' : undefined}
                onChange={(e) => field.onChange(formatNameInput(e.target.value))}
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
              required={!judoka}
              disabled={loading}
              {...fieldError('email')}
              autoComplete="email"
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
              autoComplete="tel"
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
              noOptionsText="No se encontraron opciones"
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
              noOptionsText="No se encontraron categorías"
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
              renderOption={(props, option) => {
                const { key, ...optionProps } = props as any;
                return (
                  <Box 
                    component="li" 
                    key={key} 
                    {...optionProps} 
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: beltColorMap[option] || '#ccc',
                        border: option === 'Blanco' ? '1px solid #ddd' : 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />
                    {option}
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cinturón Actual"
                  error={fieldError('cinturon_actual').error}
                  helperText={fieldError('cinturon_actual').helperText}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: field.value ? (
                      <InputAdornment position="start" sx={{ ml: 1 }}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: beltColorMap[field.value] || '#ccc',
                            border: field.value === 'Blanco' ? '1px solid #ddd' : 'none',
                          }}
                        />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              )}
              noOptionsText="No se encontraron cinturones"
            />
          )}
        />

        {!judoka && (
          <Alert severity="info" sx={{ mt: 1 }}>
            La contraseña se generará automáticamente y se enviará por correo al usuario.
          </Alert>
        )}
      </Stack>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={loading} sx={{ height: 48 }}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ height: 48, minWidth: 120 }}
        >
          {loading ? 'Guardando...' : judoka ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}
