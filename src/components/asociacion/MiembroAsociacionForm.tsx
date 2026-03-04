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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')
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

  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(miembroAsociacionSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      cargo: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      fecha_ingreso: null as string | null,
      activo: true,
    },
  })

  const fieldError = (name: keyof typeof errors) => ({
    error: !!errors[name],
    helperText: (errors[name] as { message?: string } | undefined)?.message,
  })

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

    // Preparar payload fuera del try para el React Compiler
    const baseData = {
      ...data,
      cargo: data.cargo || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      numero_celular: data.numero_celular || null,
      ci: data.ci || null,
      genero: data.genero || null,
      fecha_ingreso: data.fecha_ingreso || null,
    }

    try {
      let response
      if (miembro) {
        response = await asociacionController.updateMiembro(miembro.id, baseData as MiembroAsociacionUpdate)
      } else {
        const createData: MiembroAsociacionCreate = {
          ...baseData,
          activo: data.activo ?? true,
        } as MiembroAsociacionCreate
        response = await asociacionController.createMiembro(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) setTimeout(() => onSuccess(), 1000)
      } else {
        setError(response.error || 'Error al guardar')
      }
      setLoading(false)
    } catch (err) {
      setError('Error inesperado')
      setLoading(false)
    }
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof miembroAsociacionSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof miembroAsociacionSchema>)[]
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0]
      setFocus(firstField, { shouldSelect: true })
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{miembro ? 'Actualizado' : 'Creado'} exitosamente</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Controller name="ci" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Carnet de Identidad" required disabled={loading} {...fieldError('ci')} onChange={(e) => { field.onChange(formatCIInput(e.target.value)); if (errors.ci) trigger('ci') }} autoComplete="off" />
        )} />
        <Controller name="nombres" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Nombres" required disabled={loading} {...fieldError('nombres')} onChange={(e) => { field.onChange(formatNameInput(e.target.value)); if (errors.nombres) trigger('nombres') }} autoComplete="name" />
        )} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller name="apellido_paterno" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Apellido Paterno" disabled={loading} {...fieldError('apellido_paterno')} onChange={(e) => { field.onChange(formatNameInput(e.target.value)); if (errors.apellido_paterno) trigger('apellido_paterno'); if (errors.apellido_materno) trigger('apellido_materno') }} autoComplete="family-name" />
          )} />
          <Controller name="apellido_materno" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Apellido Materno" disabled={loading} {...fieldError('apellido_materno')} onChange={(e) => { field.onChange(formatNameInput(e.target.value)); if (errors.apellido_paterno) trigger('apellido_paterno'); if (errors.apellido_materno) trigger('apellido_materno') }} autoComplete="family-name" />
          )} />
        </Box>
        <Controller name="fecha_nacimiento" control={control} render={({ field }) => (
          <DatePicker label="Fecha de Nacimiento" value={field.value ? dayjs(field.value) : null} onChange={(v) => { const clamped = v?.isValid() && v.year() > dayjs().year() ? v.year(dayjs().year()) : v; field.onChange(clamped?.isValid() ? clamped.format('YYYY-MM-DD') : null); if (errors.fecha_nacimiento) trigger('fecha_nacimiento') }} disabled={loading} maxDate={dayjs().endOf('year')} slotProps={{ textField: { fullWidth: true, ...fieldError('fecha_nacimiento'), autoComplete: 'bday', onBlur: () => trigger('fecha_nacimiento') } }} format="DD/MM/YYYY" />
        )} />
        <Controller name="numero_celular" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Celular" disabled={loading} {...fieldError('numero_celular')} inputProps={{ maxLength: 8, autoComplete: 'tel' }} onChange={(e) => { field.onChange(formatCelularInput(e.target.value)); if (errors.numero_celular) trigger('numero_celular') }} />
        )} />
        <Controller name="genero" control={control} render={({ field }) => (
          <Autocomplete {...field} options={["Masculino", "Femenino", "Prefiero no decir"]} 
            noOptionsText="No hay opciones"
            loadingText="Cargando..."
            value={field.value || null} onChange={(_, v) => field.onChange(v || '')} disabled={loading} renderInput={(params) => <TextField {...params} label="Género" {...fieldError('genero')} inputProps={{ ...params.inputProps, autoComplete: 'off' }} />} />
        )} />
        <Controller name="fecha_ingreso" control={control} render={({ field }) => (
          <DatePicker label="Fecha de Ingreso" value={field.value ? dayjs(field.value) : null} onChange={(v) => { const clamped = v?.isValid() && v.year() > dayjs().year() ? v.year(dayjs().year()) : v; field.onChange(clamped?.isValid() ? clamped.format('YYYY-MM-DD') : null); if (errors.fecha_ingreso) trigger('fecha_ingreso') }} disabled={loading} maxDate={dayjs().endOf('year')} slotProps={{ textField: { fullWidth: true, ...fieldError('fecha_ingreso'), autoComplete: 'off', onBlur: () => trigger('fecha_ingreso') } }} format="DD/MM/YYYY" />
        )} />
        <Controller name="cargo" control={control} render={({ field }) => (
          <Autocomplete {...field} options={CARGOS_ASOCIACION} 
            noOptionsText="No se encontró el cargo"
            loadingText="Cargando..."
            value={field.value || null} onChange={(_, v) => field.onChange(v || '')} disabled={loading} renderInput={(params) => <TextField {...params} label="Cargo" {...fieldError('cargo')} inputProps={{ ...params.inputProps, autoComplete: 'off' }} />} />
        )} />
        <Controller name="email" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Email" type="email" required disabled={loading} {...fieldError('email')} onChange={(e) => { field.onChange(e.target.value); if (errors.email) trigger('email') }} autoComplete="email" />
        )} />
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && <Button variant="outlined" onClick={onCancel} disabled={loading}>Cancelar</Button>}
        <Button type="submit" variant="contained" disabled={loading} sx={{ height: '40px', minWidth: '120px' }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : (miembro ? 'Actualizar' : 'Crear')}
        </Button>
      </Box>
    </Box>
  )
}
