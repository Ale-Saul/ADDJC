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
  const [focusedField, setFocusedField] = useState<string | null>(null)

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
    mode: 'onSubmit',
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

  const onError = (formErrors: FieldErrors<z.infer<typeof judokaSchema>>) => {
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
  }

  // Opciones ordenadas alfabéticamente
  const sortedClubes = [...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club))
  const sortedSenseis = [...senseis].sort((a, b) => {
    const nameA = (a.nombres + ' ' + (a.apellidos || '')).trim()
    const nameB = (b.nombres + ' ' + (b.apellidos || '')).trim()
    return nameA.localeCompare(nameB)
  })
  const generos = ["Masculino", "Femenino", "Prefiero no decir"].sort((a, b) => a.localeCompare(b))
  const categorias = ["Preinfantil", "Infantil", "Cadete", "Junior", "Senior"].sort((a, b) => a.localeCompare(b))
  const cinturones = ["Blanco", "Amarillo", "Naranja", "Verde", "Azul", "Café", "Negro"].sort((a, b) => a.localeCompare(b))

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
        peso_competitivo: judoka.peso_competitivo || null,
        cinturon_actual: judoka.cinturon_actual || '',
        activo: judoka.activo,
      })
    }
  }, [judoka, reset])

  // Si es un sensei o encargado creando un nuevo judoka, pre-completar el club
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
        const createData: JudokaCreate = {
          ...(payload as JudokaCreate),
          usuario_id: 'temp-user-id',
        }
        response = await judokaController.createJudoka(createData)
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info" sx={{ mb: 1 }}>
          La contraseña se generará automáticamente como <strong>Judo.[Carnet]</strong> y se enviará por correo al usuario.
        </Alert>

        <FormControl fullWidth error={fieldError('club_id').error}>
          <InputLabel>Club</InputLabel>
          <Controller
            name="club_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Club"
                disabled={loading || loadingClubes || user?.rol === 'sensei' || user?.rol === 'encargado'}
                onFocus={() => setFocusedField('club_id')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin club</em></MenuItem>
                {sortedClubes.map((club) => (
                  <MenuItem key={club.id} value={club.id}>{club.nombre_club}</MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('club_id').helperText && <FormHelperText>{fieldError('club_id').helperText}</FormHelperText>}
          {(user?.rol === 'sensei' || user?.rol === 'encargado') && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Los judokas se crearán automáticamente en tu club
            </Typography>
          )}
        </FormControl>

        <FormControl fullWidth error={fieldError('entrenador_id').error}>
          <InputLabel>Entrenador</InputLabel>
          <Controller
            name="entrenador_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Entrenador"
                disabled={loading || loadingSenseis || !watchClubId || user?.rol === 'sensei'}
                onFocus={() => setFocusedField('entrenador_id')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin entrenador</em></MenuItem>
                {sortedSenseis.map((sensei) => (
                  <MenuItem key={sensei.id} value={sensei.id}>
                    {sensei.nombres} {sensei.apellidos}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('entrenador_id').helperText && <FormHelperText>{fieldError('entrenador_id').helperText}</FormHelperText>}
          {user?.rol === 'sensei' ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Serás asignado automáticamente como entrenador
            </Typography>
          ) : !watchClubId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Selecciona un club primero para ver los entrenadores disponibles
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
              required={!judoka}
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
                {generos.map(g => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('genero').helperText && <FormHelperText>{fieldError('genero').helperText}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={fieldError('categoria').error}>
          <InputLabel>Categoría</InputLabel>
          <Controller
            name="categoria"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Categoría"
                disabled={loading}
                onFocus={() => setFocusedField('categoria')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin definir</em></MenuItem>
                {categorias.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('categoria').helperText && <FormHelperText>{fieldError('categoria').helperText}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={fieldError('cinturon_actual').error}>
          <InputLabel>Cinturón Actual</InputLabel>
          <Controller
            name="cinturon_actual"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Cinturón Actual"
                disabled={loading}
                onFocus={() => setFocusedField('cinturon_actual')}
                onBlur={() => setFocusedField(null)}
              >
                <MenuItem value=""><em>Sin definir</em></MenuItem>
                {cinturones.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            )}
          />
          {fieldError('cinturon_actual').helperText && <FormHelperText>{fieldError('cinturon_actual').helperText}</FormHelperText>}
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
          {loading ? 'Guardando...' : judoka ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

