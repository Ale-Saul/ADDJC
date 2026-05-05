'use client'

import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { enviarNotificacionManualSchema } from '@/schemas/comunicacionSchema'
import { useDestinatariosNotificacion, useEnviarNotificacionManual } from '@/hooks/useNotificaciones'
import { FormInput } from '@/components/ui/FormInput'
import { ROLE_LABELS, ROL } from '@/constants/roles'
import type { NotificacionDestinatario } from '@/models/comunicacion'
import { formatTextoInput } from '@/utils/formatters'

type FormValues = z.infer<typeof enviarNotificacionManualSchema>
type RolConEnvioManual = typeof ROL.ASOCIACION | typeof ROL.ENCARGADO

interface Props {
  remitenteId: string
  remitenteRol: RolConEnvioManual
  remitenteClubId?: string | null
  onCancel: () => void
  onSuccess: () => void
}

export default function EnviarNotificacionManualForm({
  remitenteId,
  remitenteRol,
  remitenteClubId,
  onCancel,
  onSuccess,
}: Props) {
  const [search, setSearch] = useState('')
  const [selectedDestinatario, setSelectedDestinatario] = useState<NotificacionDestinatario | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: destinatarios = [], isLoading } = useDestinatariosNotificacion(
    remitenteRol,
    remitenteClubId,
    search
  )

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(enviarNotificacionManualSchema),
    defaultValues: {
      remitente_id: remitenteId,
      remitente_rol: remitenteRol,
      remitente_club_id: remitenteClubId ?? null,
      destinatario_id: '',
      titulo: '',
      mensaje: '',
    },
  })

  const destinatarioId = useWatch({ control, name: 'destinatario_id' })
  const enviarMutation = useEnviarNotificacionManual(remitenteId, destinatarioId)

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    const response = await enviarMutation.mutateAsync({
      ...values,
      titulo: values.titulo.replace(/\s+/g, ' ').trim(),
      mensaje: values.mensaje.replace(/\s+/g, ' ').trim(),
    })

    if (!response.success) {
      setSubmitError(response.error ?? 'No se pudo enviar la notificación')
      return
    }

    onSuccess()
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)}>
      {submitError && <Alert severity="error">{submitError}</Alert>}

      {remitenteRol === ROL.ENCARGADO && !remitenteClubId && (
        <Alert severity="warning">
          No tienes un club asignado, por lo que no puedes enviar notificaciones directas.
        </Alert>
      )}

      <Controller
        name="destinatario_id"
        control={control}
        render={({ field, fieldState: { error } }) => {
          const selected =
            selectedDestinatario?.id === field.value
              ? selectedDestinatario
              : destinatarios.find(destinatario => destinatario.id === field.value) ?? null

          return (
            <Autocomplete
              options={destinatarios}
              value={selected}
              inputValue={search}
              loading={isLoading}
              disabled={isSubmitting || enviarMutation.isPending || (remitenteRol === ROL.ENCARGADO && !remitenteClubId)}
              onChange={(_, value) => {
                setSelectedDestinatario(value)
                field.onChange(value?.id ?? '')
                if (value) setSearch(value.nombre_completo)
              }}
              onInputChange={(_, value, reason) => {
                if (reason === 'input') {
                  setSearch(current => current === value ? current : value)
                }
                if (reason === 'clear') {
                  setSearch('')
                  setSelectedDestinatario(null)
                  field.onChange('')
                }
              }}
              getOptionLabel={(option: NotificacionDestinatario) => option.nombre_completo}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="Sin usuarios disponibles"
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack spacing={0.25} sx={{ py: 0.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={600}>
                        {option.nombre_completo}
                      </Typography>
                      <Chip
                        label={ROLE_LABELS[option.rol]}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {option.email || 'Sin correo'}
                      {option.club_nombre ? ` · ${option.club_nombre}` : ''}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Destinatario"
                  required
                  error={!!error}
                  helperText={error?.message ?? 'Busca por nombre, apellido o correo'}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoading && <CircularProgress color="inherit" size={18} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )
        }}
      />

      <FormInput
        name="titulo"
        control={control}
        label="Asunto"
        required
        inputProps={{ maxLength: 150 }}
        formatValue={formatTextoInput}
        disabled={isSubmitting || enviarMutation.isPending}
      />

      <FormInput
        name="mensaje"
        control={control}
        label="Mensaje"
        required
        multiline
        minRows={4}
        inputProps={{ maxLength: 500 }}
        formatValue={formatTextoInput}
        disabled={isSubmitting || enviarMutation.isPending}
        helperText="Máximo 500 caracteres"
      />

      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button onClick={onCancel} disabled={isSubmitting || enviarMutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={enviarMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          disabled={isSubmitting || enviarMutation.isPending || (remitenteRol === ROL.ENCARGADO && !remitenteClubId)}
        >
          Enviar
        </Button>
      </Stack>
    </Stack>
  )
}
