'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stack, Button, Alert, CircularProgress, Typography } from '@mui/material'
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
  onSuccess: (data: AsistenciaSesionCreate) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

export default function NuevaSesionForm({ clubId, senseiId, createdBy, onSuccess, onCancel }: Props) {
  const [categoriasEntrenador, setCategoriasEntrenador] = useState<string[]>([])
  const [cargandoCategorias, setCargandoCategorias] = useState(true)

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {errors.root && (
          <Alert severity="error" role="alert">
            {errors.root.message}
          </Alert>
        )}

        <FormDatePicker
          name="fecha"
          control={control}
          label="Fecha de la clase *"
          maxDate={dayjs()}
        />

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
            sx={{ minHeight: '44px' }}
            aria-label="Crear sesión de asistencia"
          >
            {isSubmitting ? 'Creando…' : 'Crear sesión'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
