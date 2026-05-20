'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stack, Button, Alert, CircularProgress } from '@mui/material'
import { FormInput } from '@/components/ui/FormInput'
import { FormDatePicker } from '@/components/ui/FormDatePicker'
import { createSesionSchema } from '@/schemas/asistenciaSchema'
import { AsistenciaSesionCreate } from '@/models/asistencia'
import { clubController } from '@/controllers/clubController'
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
  const {
    control,
    handleSubmit,
    setError,
    reset,
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
      notas: null,
    }
  })

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

  const onSubmit = async (values: FormValues) => {
    // Normalizar espacios y recortar bordes en campos de texto libre
    const payload: AsistenciaSesionCreate = {
      ...values,
      titulo: values.titulo ? values.titulo.replace(/\s+/g, ' ').trim() || null : null,
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

        <FormInput
          name="titulo"
          control={control}
          label="Título / tema (opcional)"
          placeholder="Ej: Clase de técnica de pie"
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
