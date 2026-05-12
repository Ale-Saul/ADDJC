'use client'

import { useState } from 'react'
import {
  Button,
  Grid,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { miembroAsociacionSchema } from '@/schemas/globales'
import { z } from 'zod'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import { formatCIInput, formatCIExtensionInput, formatNameInput, formatCelularInput } from '@/utils/formatters'
import { FormInput, FormAutocomplete, FormDatePicker } from '@/components/ui'
import { CARGOS_ASOCIACION, GENDERS_LIST } from '@/constants/globales'
import dayjs from 'dayjs'

type MiembroAsociacionFormData = z.infer<typeof miembroAsociacionSchema>

interface Props {
  miembro?: MiembroAsociacion
  onSuccess: () => void
  onCancel: () => void
}

export default function MiembroAsociacionForm({ miembro, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    trigger
  } = useForm<MiembroAsociacionFormData>({
    resolver: zodResolver(miembroAsociacionSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      ci: miembro?.ci || '',
      ci_extension: miembro?.ci_extension || '',
      nombres: miembro?.nombres || '',
      apellido_paterno: miembro?.apellido_paterno || '',
      apellido_materno: miembro?.apellido_materno || '',
      fecha_nacimiento: miembro?.fecha_nacimiento || null,
      genero: miembro?.genero || '',
      email: miembro?.email || '',
      numero_celular: miembro?.numero_celular || '',
      cargo: miembro?.cargo || '',
      fecha_ingreso: miembro?.fecha_ingreso || null,
      password: '',
      activo: miembro?.activo ?? true,
    },
  })

  const mapRolesToOptions = (roles: readonly string[]) =>
    roles.map(rol => ({
      value: rol,
      label: rol
    }))

  const roleOptions = mapRolesToOptions(CARGOS_ASOCIACION)

  const onSubmit = async (data: MiembroAsociacionFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await (miembro
        ? asociacionController.updateMiembro(miembro.id, data as unknown as MiembroAsociacionUpdate)
        : asociacionController.createMiembro(data as unknown as MiembroAsociacionCreate))

      if (response.success) {
        onSuccess()
      } else {
        setError(response.error || 'Error al guardar los datos')
      }
    } catch {
      setError('Ocurrió un error inesperado al guardar los datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit )} noValidate sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <FormInput
            name="ci"
            control={control}
            label="Carnet de Identidad"
            required
            disabled={loading}
            formatValue={formatCIInput}
            inputProps={{ maxLength: 7 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormInput
            name="ci_extension"
            control={control}
            label="Extensión"
            disabled={loading}
            formatValue={formatCIExtensionInput}
            inputProps={{ maxLength: 2 }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormInput
            name="nombres"
            control={control}
            label="Nombres"
            required
            formatValue={formatNameInput}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput
            name="apellido_paterno"
            control={control}
            label="Primer Apellido"
            required
            formatValue={formatNameInput}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput
            name="apellido_materno"
            control={control}
            label="Segundo Apellido"
            formatValue={formatNameInput}
          />
        </Grid>
        {!miembro && (
          <Grid size={{ xs: 12 }}>
            <FormInput
              name="email"
              control={control}
              label="Correo Electrónico"
              required
              disabled={loading}
              inputProps={{ type: 'email' }}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <FormInput
            name="numero_celular"
            control={control}
            label="Teléfono Celular"
            formatValue={formatCelularInput}
            inputProps={{ 
              maxLength: 8, 
              autoComplete: 'tel',
              name: 'tel_celular',
              id: 'tel_celular'
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length === 8) {
                trigger('numero_celular');
              }
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormDatePicker
            name="fecha_nacimiento"
            control={control}
            label="Fecha de Nacimiento"
            maxDate={dayjs()}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormAutocomplete
            name="genero"
            control={control}
            label="Género"
            options={GENDERS_LIST.map(g => ({ value: g, label: g }))}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormAutocomplete
            name="cargo"
            control={control}
            label="Cargo"
            options={roleOptions}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormDatePicker
            name="fecha_ingreso"
            control={control }
            label="Fecha de Ingreso"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : miembro ? 'Actualizar Miembro' : 'Registrar Miembro'}
        </Button>
      </Box>
    </Box>
  )
}



