'use client'

import { Box, Button, Grid, Alert, CircularProgress, Autocomplete, TextField, Chip } from '@mui/material'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Sensei } from '@/models/sensei'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'
import { ESPECIALIDADES_SENSEI, GENDERS_LIST, GRADOS_DAN } from '@/constants/globales'
import {
  formatCIInput,
  formatCIExtensionInput,
  formatCelularInput,
  formatNameInput
} from '@/utils/formatters'
import { useSenseiForm } from '@/hooks/useSenseiForm'
import { FormInput, FormAutocomplete, FormDatePicker } from '@/components/ui'

dayjs.locale('es')

interface SenseiFormProps {
  sensei?: Sensei
  onSuccess: () => void
  onCancel: () => void
}

export default function SenseiForm({ sensei, onSuccess, onCancel }: SenseiFormProps) {
  const { user } = useAuth()
  const {
    form,
    error,
    loading,
    clubes,
    loadingClubes,
    onSubmit,
    usuarioDirectivo,
    buscandoCI,
  } = useSenseiForm(sensei, user || undefined, onSuccess)

  const { control, handleSubmit, formState: { errors }, trigger } = form

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <FormInput
            name="ci"
            label="Carnet de Identidad"
            control={control}
            disabled={loading}
            required
            formatValue={formatCIInput}
            inputProps={{ maxLength: 7 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormInput
            name="ci_extension"
            label="Complemento"
            control={control}
            disabled={loading}
            formatValue={formatCIExtensionInput}
            inputProps={{ maxLength: 2 }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormInput
            name="nombres"
            label="Nombres"
            control={control}
            disabled={loading}
            required
            formatValue={formatNameInput}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput
            name="apellido_paterno"
            label="Primer Apellido"
            control={control}
            disabled={loading}
            required
            formatValue={formatNameInput}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput
            name="apellido_materno"
            label="Segundo Apellido"
            control={control}
            disabled={loading}
            formatValue={formatNameInput}
          />
        </Grid>
        {/* Aviso de vinculación silenciosa */}
        {!sensei && usuarioDirectivo && (
          <Grid size={{ xs: 12 }}>
            <Alert 
              severity="info"
              icon={false}
              sx={{ py: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <strong>Vinculación silenciosa:</strong>
                <span>
                  El CI pertenece a <strong>{usuarioDirectivo.nombre}</strong>
                </span>
                <Chip
                  label={usuarioDirectivo.rol === 'admin' ? 'Administrador' : 'Asociación'}
                  size="small"
                  color="primary"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
                <span>— se vinculará este usuario como Sensei sin crear una nueva cuenta.</span>
              </Box>
            </Alert>
          </Grid>
        )}
        {buscandoCI && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.8rem' }}>
              <CircularProgress size={14} />
              Verificando CI...
            </Box>
          </Grid>
        )}

        {/* Campo email: ocultar en vinculación silenciosa (el directivo ya tiene cuenta) */}
        {!sensei && !usuarioDirectivo && (
          <Grid size={{ xs: 12 }}>
            <FormInput
              name="email"
              label="Correo Electrónico"
              control={control}
              disabled={loading}
              required
              inputProps={{ type: 'email' }}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <FormInput
            name="numero_celular"
            label="Teléfono Celular"
            control={control}
            disabled={loading}
            formatValue={formatCelularInput}
            inputProps={{ 
              maxLength: 8, 
              autoComplete: 'tel',
              name: 'tel_celular',
              id: 'tel_celular'
            }}
            onChange={(e) => {
              if (e.target.value.length === 8) trigger('numero_celular');
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormDatePicker
            name="fecha_nacimiento"
            label="Fecha de Nacimiento"
            control={control}
            disabled={loading}
            maxDate={dayjs()}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormAutocomplete
            name="genero"
            label="Género"
            control={control}
            disabled={loading}
            options={GENDERS_LIST.map(g => ({ value: g, label: g }))}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="club_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={[...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club))}
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
                disabled={loading || loadingClubes || user?.rol === ROL.ENCARGADO}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Club"
                    error={!!errors.club_id}
                    helperText={errors.club_id?.message as string}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingClubes ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText="No se encontraron clubes"
                loadingText="Cargando clubes..."
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormAutocomplete
            name="grado_dan"
            label="Grado Dan"
            control={control}
            disabled={loading}
            required
            options={GRADOS_DAN.map(g => ({ value: g, label: g }))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormAutocomplete
            name="especialidad"
            label="Especialidad"
            control={control}
            disabled={loading}
            options={ESPECIALIDADES_SENSEI.map(e => ({ value: e, label: e }))}
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
          {loading ? <CircularProgress size={20} /> : sensei ? 'Actualizar Sensei' : 'Registrar Sensei'}
        </Button>
      </Box>
    </Box>
  )
}
