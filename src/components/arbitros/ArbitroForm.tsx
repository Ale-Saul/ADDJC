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
  Autocomplete,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
import { arbitroSchema } from '@/utils/zodSchemas'
import { formatCIInput, formatCelularInput, formatNameInput } from '@/utils/inputMasks'

interface ArbitroFormProps {
  arbitro?: Arbitro | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ArbitroForm({ arbitro, onSuccess, onCancel }: ArbitroFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(arbitroSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      nivel_arbitraje: '',
      activo: true,
    },
  })

  const fieldError = (name: keyof typeof errors) => ({
    error: !!errors[name],
    helperText: (errors[name] as { message?: string } | undefined)?.message,
  })

  useEffect(() => {
    if (arbitro) {
      const ap = arbitro.apellidos?.trim().split(/\s+/) ?? []
      reset({
        nombres: arbitro.nombres,
        apellido_paterno: arbitro.apellido_paterno ?? ap[0] ?? '',
        apellido_materno: arbitro.apellido_materno ?? ap.slice(1).join(' ') ?? '',
        email: arbitro.email || '',
        fecha_nacimiento: arbitro.fecha_nacimiento || null,
        numero_celular: arbitro.numero_celular || '',
        ci: arbitro.ci || '',
        genero: arbitro.genero || '',
        nivel_arbitraje: arbitro.nivel_arbitraje || '',
        activo: arbitro.activo,
      })
    }
  }, [arbitro, reset])

  const onSubmit = async (data: z.infer<typeof arbitroSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const payload = {
      ...data,
      apellido_paterno: data.apellido_paterno?.trim() || null,
      apellido_materno: data.apellido_materno?.trim() || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      numero_celular: data.numero_celular || null,
      ci: data.ci || null,
      genero: data.genero || null,
      nivel_arbitraje: data.nivel_arbitraje || null,
    }

    try {
      let response
      if (arbitro) {
        response = await arbitroController.updateArbitro(arbitro.id, payload as ArbitroUpdate)
      } else {
        const createData: ArbitroCreate = {
          ...(payload as ArbitroCreate),
          usuario_id: 'temp-user-id',
        }
        response = await arbitroController.createArbitro(createData)
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

  const onError = (formErrors: FieldErrors<z.infer<typeof arbitroSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof arbitroSchema>)[]
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0]
      setFocus(firstField, { shouldSelect: true })
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{arbitro ? 'Actualizado' : 'Creado'} exitosamente</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Controller name="ci" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Carnet de Identidad" required disabled={loading} {...fieldError('ci')} onChange={(e) => field.onChange(formatCIInput(e.target.value))} autoComplete="off" />
        )} />
        <Controller name="nombres" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Nombres" required disabled={loading} {...fieldError('nombres')} onChange={(e) => field.onChange(formatNameInput(e.target.value))} autoComplete="name" />
        )} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller name="apellido_paterno" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Apellido Paterno" disabled={loading} {...fieldError('apellido_paterno')} onChange={(e) => field.onChange(formatNameInput(e.target.value))} autoComplete="off" />
          )} />
          <Controller name="apellido_materno" control={control} render={({ field }) => (
            <TextField {...field} fullWidth label="Apellido Materno" disabled={loading} {...fieldError('apellido_materno')} onChange={(e) => field.onChange(formatNameInput(e.target.value))} autoComplete="off" />
          )} />
        </Box>
        <Controller name="email" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Email" type="email" required disabled={loading} {...fieldError('email')} autoComplete="email" />
        )} />
        <Controller name="fecha_nacimiento" control={control} render={({ field }) => (
          <DatePicker label="Fecha de Nacimiento" value={field.value ? dayjs(field.value) : null} onChange={(v) => field.onChange(v?.isValid() ? v.format('YYYY-MM-DD') : null)} disabled={loading} slotProps={{ textField: { fullWidth: true, ...fieldError('fecha_nacimiento'), autoComplete: 'bday' } }} format="DD/MM/YYYY" />
        )} />
        <Controller name="numero_celular" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Celular" disabled={loading} {...fieldError('numero_celular')} inputProps={{ maxLength: 8, autoComplete: 'tel' }} onChange={(e) => field.onChange(formatCelularInput(e.target.value))} />
        )} />
        <Controller name="genero" control={control} render={({ field }) => (
          <Autocomplete {...field} options={["Masculino", "Femenino", "Prefiero no decir"]}
            noOptionsText="No hay opciones"
            value={field.value || null} onChange={(_, v) => field.onChange(v || '')} disabled={loading} renderInput={(params) => <TextField {...params} label="Género" {...fieldError('genero')} inputProps={{ ...params.inputProps, autoComplete: 'off' }} />} />
        )} />
        <Controller name="nivel_arbitraje" control={control} render={({ field }) => (
          <Autocomplete {...field} options={["Regional", "Nacional", "Internacional"]}
            noOptionsText="No se encontró el nivel"
            loadingText="Cargando..."
            value={field.value || null} onChange={(_, v) => field.onChange(v || '')} disabled={loading} renderInput={(params) => <TextField {...params} label="Nivel de Arbitraje" {...fieldError('nivel_arbitraje')} inputProps={{ ...params.inputProps, autoComplete: 'off' }} />} />
        )} />

        {!arbitro && (
          <Alert severity="info" sx={{ mt: 1 }}>
            La contraseña se generará automáticamente y se enviará por correo al usuario.
          </Alert>
        )}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && <Button variant="outlined" onClick={onCancel} disabled={loading}>Cancelar</Button>}
        <Button type="submit" variant="contained" disabled={loading} sx={{ height: '40px', minWidth: '120px' }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : (arbitro ? 'Actualizar' : 'Crear')}
        </Button>
      </Box>
    </Box>
  )
}
