'use client'

import { Box, Button, Grid, Alert, CircularProgress } from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Arbitro } from '@/models/arbitro'
import { useArbitroForm } from '@/hooks/useArbitroForm'
import { formatCIInput, formatCIExtensionInput, formatNameInput, formatCelularInput } from '@/utils/formatters'
import { FormInput, FormAutocomplete, FormDatePicker } from '@/components/ui'
import { GENDERS_LIST, NIVELES_ARBITRAJE } from '@/constants/globales'

dayjs.locale('es')

interface ArbitroFormProps {
  arbitro?: Arbitro | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ArbitroForm({ arbitro, onSuccess, onCancel }: ArbitroFormProps) {
  const { form, loading, error, onSubmit } = useArbitroForm(arbitro, onSuccess)
  const { control, handleSubmit, trigger } = form

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
            label="Extensión" 
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
        {!arbitro && (
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
          <FormAutocomplete 
            name="nivel_arbitraje" 
            label="Nivel de Arbitraje" 
            control={control} 
            disabled={loading}
            options={NIVELES_ARBITRAJE.map(n => ({ value: n, label: n }))} 
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
          {loading ? <CircularProgress size={20} /> : arbitro ? 'Actualizar Árbitro' : 'Registrar Árbitro'}
        </Button>
      </Box>
    </Box>
  )
}
