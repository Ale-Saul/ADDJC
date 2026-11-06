'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Stack,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Paper,
} from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DateRangeIcon from '@mui/icons-material/DateRange'
import { FormInput } from '@/components/ui/FormInput'
import { FormDatePicker } from '@/components/ui/FormDatePicker'
import { FormAutocomplete } from '@/components/ui/FormAutocomplete'
import { CATEGORIES } from '@/constants/globales'
import { createSesionSchema } from '@/schemas/asistenciaSchema'
import { AsistenciaSesionCreate } from '@/models/asistencia'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { formatHoraInput, formatHoraDbToInput, formatTextoInput } from '@/utils/formatters'
import dayjs from 'dayjs'

type FormValues = z.infer<typeof createSesionSchema>

interface Props {
  clubId: string
  senseiId: string
  createdBy: string
  onSuccess: (data: AsistenciaSesionCreate | AsistenciaSesionCreate[]) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

const DIAS_SEMANA = [
  { id: 1, label: 'Lunes', short: 'Lun' },
  { id: 2, label: 'Martes', short: 'Mar' },
  { id: 3, label: 'Miércoles', short: 'Mié' },
  { id: 4, label: 'Jueves', short: 'Jue' },
  { id: 5, label: 'Viernes', short: 'Vie' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
]

export default function NuevaSesionForm({ clubId, senseiId, createdBy, onSuccess, onCancel }: Props) {
  const [categoriasEntrenador, setCategoriasEntrenador] = useState<string[]>([])
  const [cargandoCategorias, setCargandoCategorias] = useState(true)
  const [modoCreacion, setModoCreacion] = useState<'dia' | 'semana'>('dia')
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([1, 2, 3, 4, 5]) // L-V por defecto

  const {
    control,
    handleSubmit,
    setError,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(createSesionSchema),
    defaultValues: {
      club_id: clubId,
      sensei_id: senseiId,
      fecha: dayjs().format('YYYY-MM-DD'),
      hora_inicio: null,
      hora_fin: null,
      titulo: null,
      categoria: null,
      notas: null,
    }
  })

  const watchFecha = watch('fecha')

  // Obtener el lunes de la semana de la fecha seleccionada
  const lunesSemana = useMemo(() => {
    const d = dayjs(watchFecha || undefined)
    const day = d.day() // 0 = Dom, 1 = Lun, ...
    const diff = day === 0 ? -6 : 1 - day
    return d.add(diff, 'day').startOf('day')
  }, [watchFecha])

  const toggleDia = (id: number) => {
    setDiasSeleccionados(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id].sort()
    )
  }

  // Cargar categorías asignadas al entrenador
  useEffect(() => {
    if (!senseiId) {
      setCargandoCategorias(false)
      return
    }

    let cancelled = false
    const cargarCategorias = async () => {
      setCargandoCategorias(true)
      const res = await senseiController.getSenseiById(senseiId)
      if (cancelled) return
      if (res.success && res.data) {
        const cats = Array.isArray(res.data.categorias) && res.data.categorias.length > 0
          ? res.data.categorias
          : []
        setCategoriasEntrenador(cats)
        if (cats.length === 1) {
          setValue('categoria', cats[0])
        }
      }
      setCargandoCategorias(false)
    }

    void cargarCategorias()

    return () => {
      cancelled = true
    }
  }, [senseiId, setValue])

  useEffect(() => {
    if (!clubId) return

    let cancelled = false

    const precargarHorarioClub = async () => {
      const res = await clubController.getClubById(clubId)
      if (cancelled || !res.success || !res.data) return

      const horaInicio = formatHoraDbToInput(res.data.horario_inicio)
      const horaFin = formatHoraDbToInput(res.data.horario_fin)
      if (!horaInicio && !horaFin) return

      reset((current) => ({
        ...current,
        hora_inicio: horaInicio ?? current.hora_inicio,
        hora_fin: horaFin ?? current.hora_fin,
      }))
    }

    void precargarHorarioClub()

    return () => {
      cancelled = true
    }
  }, [clubId, reset])

  const opcionesCategoria = useMemo(() => {
    if (categoriasEntrenador.length > 0) {
      return [
        { value: '', label: 'Seleccionar categoría…' },
        ...categoriasEntrenador.map(c => ({ value: c, label: c }))
      ]
    }
    // Si el entrenador no tiene categorías específicas en su perfil
    return [
      { value: '', label: 'Todas las categorías (general)' },
      ...CATEGORIES.map(c => ({ value: c, label: c }))
    ]
  }, [categoriasEntrenador])

  const onSubmit = async (values: FormValues) => {
    if (modoCreacion === 'semana' && diasSeleccionados.length === 0) {
      setError('root', { message: 'Debes seleccionar al menos un día de la semana para planificar.' })
      return
    }

    if (modoCreacion === 'semana') {
      const payloads: AsistenciaSesionCreate[] = diasSeleccionados.map(diaNum => {
        const fechaDia = lunesSemana.add(diaNum - 1, 'day').format('YYYY-MM-DD')
        return {
          ...values,
          fecha: fechaDia,
          titulo: values.titulo ? values.titulo.replace(/\s+/g, ' ').trim() || null : null,
          categoria: values.categoria?.trim() || null,
          notas: values.notas ? values.notas.replace(/\s+/g, ' ').trim() || null : null,
          created_by: createdBy,
        }
      })

      const res = await onSuccess(payloads)
      if (!res.success) {
        setError('root', { message: res.error || 'Error al crear las sesiones semanales' })
      }
    } else {
      const payload: AsistenciaSesionCreate = {
        ...values,
        titulo: values.titulo ? values.titulo.replace(/\s+/g, ' ').trim() || null : null,
        categoria: values.categoria?.trim() || null,
        notas: values.notas ? values.notas.replace(/\s+/g, ' ').trim() || null : null,
        created_by: createdBy,
      }
      const res = await onSuccess(payload)
      if (!res.success) {
        setError('root', { message: res.error || 'Error al crear la sesión' })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {errors.root && (
          <Alert severity="error" role="alert">
            {errors.root.message}
          </Alert>
        )}

        {/* Selector de Modalidad: Día único vs Toda la semana */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={0.8}>
            Modalidad de creación:
          </Typography>
          <ToggleButtonGroup
            value={modoCreacion}
            exclusive
            onChange={(_, val) => val && setModoCreacion(val)}
            fullWidth
            size="small"
          >
            <ToggleButton value="dia" sx={{ py: 1, textTransform: 'none', fontWeight: 600 }}>
              <CalendarTodayIcon sx={{ mr: 1, fontSize: 18 }} />
              Día único
            </ToggleButton>
            <ToggleButton value="semana" sx={{ py: 1, textTransform: 'none', fontWeight: 600 }}>
              <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} />
              Planificar toda la semana
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {modoCreacion === 'dia' ? (
          <FormDatePicker
            name="fecha"
            control={control}
            label="Fecha del entrenamiento *"
          />
        ) : (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.03)', borderColor: 'primary.light' }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold">
                📅 Planificación semanal de entrenamientos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Semana seleccionada: <strong>Lunes {lunesSemana.format('DD/MM')}</strong> al <strong>Sábado {lunesSemana.add(5, 'day').format('DD/MM/YYYY')}</strong>
              </Typography>

              <FormDatePicker
                name="fecha"
                control={control}
                label="Referencia / Semana del *"
              />

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={0.5}>
                  Días de entrenamiento a generar ({diasSeleccionados.length} seleccionados):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8 }}>
                  {DIAS_SEMANA.map(dia => {
                    const isSelected = diasSeleccionados.includes(dia.id)
                    const fechaDelDia = lunesSemana.add(dia.id - 1, 'day').format('DD/MM')
                    return (
                      <Chip
                        key={dia.id}
                        label={`${dia.label} (${fechaDelDia})`}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        onClick={() => toggleDia(dia.id)}
                        sx={{ fontWeight: isSelected ? 'bold' : 'normal', cursor: 'pointer' }}
                      />
                    )
                  })}
                </Stack>
              </Box>

              {/* Atajos rápidos */}
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5, pt: 0.5 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setDiasSeleccionados([1, 2, 3, 4, 5])}
                  sx={{ fontSize: '0.72rem', py: 0.2 }}
                >
                  Lun a Vie
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setDiasSeleccionados([1, 3, 5])}
                  sx={{ fontSize: '0.72rem', py: 0.2 }}
                >
                  Lun, Mié, Vie
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setDiasSeleccionados([2, 4])}
                  sx={{ fontSize: '0.72rem', py: 0.2 }}
                >
                  Mar y Jue
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setDiasSeleccionados([1, 2, 3, 4, 5, 6])}
                  sx={{ fontSize: '0.72rem', py: 0.2 }}
                >
                  Toda la semana (L-S)
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        <FormAutocomplete
          name="categoria"
          control={control}
          label="Categoría del entrenamiento"
          options={opcionesCategoria}
          disabled={cargandoCategorias}
          helperText={
            cargandoCategorias
              ? 'Cargando categorías del entrenador…'
              : categoriasEntrenador.length > 0
              ? 'Mostrando solo las categorías a cargo de este entrenador'
              : 'El entrenador no tiene categorías específicas asignadas en su perfil'
          }
        />

        <FormInput
          name="titulo"
          control={control}
          label="Título / tema (opcional)"
          placeholder="Ej: Entrenamiento táctico y definición"
          size="small"
          formatValue={formatTextoInput}
          inputProps={{ maxLength: 120 }}
        />

        <Stack direction="row" spacing={2}>
          <FormInput
            name="hora_inicio"
            control={control}
            label="Hora inicio"
            placeholder="08:00"
            size="small"
            formatValue={formatHoraInput}
            inputProps={{ maxLength: 5, inputMode: 'numeric' }}
          />
          <FormInput
            name="hora_fin"
            control={control}
            label="Hora fin"
            placeholder="10:00"
            size="small"
            formatValue={formatHoraInput}
            inputProps={{ maxLength: 5, inputMode: 'numeric' }}
          />
        </Stack>

        <FormInput
          name="notas"
          control={control}
          label="Notas (opcional)"
          multiline
          rows={2}
          size="small"
          formatValue={formatTextoInput}
          inputProps={{ maxLength: 500 }}
        />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isSubmitting}
            sx={{ minHeight: '44px' }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minHeight: '44px', fontWeight: 'bold' }}
            aria-label="Crear sesión de asistencia"
          >
            {isSubmitting
              ? 'Creando…'
              : modoCreacion === 'semana'
              ? `Crear ${diasSeleccionados.length} sesiones de la semana`
              : 'Crear sesión'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
