'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Box, Button, Grid, Alert, CircularProgress } from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { judokaSchema } from '@/schemas/globales'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'
import {
  formatCIInput,
  formatCIExtensionInput,
  formatCelularInput,
  formatNameInput
} from '@/utils/formatters'
import { CATEGORIES, BELT_COLORS, GENDERS_LIST } from '@/constants/globales'
import { FormInput, FormAutocomplete, FormDatePicker } from '@/components/ui'

dayjs.locale('es')

interface JudokaFormProps {
  judoka?: Judoka | null
  onSuccess: () => void
  onCancel: () => void
}

export default function JudokaForm({ judoka, onSuccess, onCancel }: JudokaFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { control, handleSubmit, reset, watch, trigger } = useForm<z.infer<typeof judokaSchema>>({
    resolver: zodResolver(judokaSchema),
    mode: 'onTouched',
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
      ci_extension: '',
      genero: '',
      categoria: '',
      cinturon_actual: '',
      activo: true,
    },
  })

  const watchClubId = watch('club_id')

  const { data: clubesResponse, isLoading: loadingClubes } = useQuery({
    queryKey: ['clubes', 'all'],
    queryFn: () => clubController.getAllClubes(false),
  })
  const clubes = clubesResponse?.success && clubesResponse?.data ? clubesResponse.data : []

  const { data: senseisResponse, isLoading: loadingSenseis } = useQuery({
    queryKey: ['senseis', 'byClub', watchClubId],
    queryFn: () => senseiController.getSenseisByClub(watchClubId as string),
    enabled: !!watchClubId,
  })
  const senseis = senseisResponse?.success && senseisResponse?.data ? senseisResponse.data : []

  const isClubManager = user?.rol === ROL.ENCARGADO
  const isSensei = user?.rol === ROL.SENSEI

  const onSubmit = async (data: z.infer<typeof judokaSchema>) => {
    setLoading(true)
    setError(null)
    try {
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
        updated_by: user?.id || null
      }

      let response
      if (judoka) {
        response = await judokaController.updateJudoka(judoka.id, {
          ...(payload as JudokaUpdate),
          updated_by: user?.id
        })
      } else {
        response = await judokaController.createJudoka({
          ...(payload as JudokaCreate),
          updated_by: user?.id
        }, user?.id)
      }

      if (response.success) {
        onSuccess()
      } else {
        setError(response.error || 'Error al guardar el judoka')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al guardar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (judoka) {
      reset({
        club_id: judoka.club_id || '',
        entrenador_id: judoka.entrenador_id || '',
        nombres: judoka.nombres || '',
        apellido_paterno: judoka.apellido_paterno || '',
        apellido_materno: judoka.apellido_materno || '',
        email: judoka.email || '',
        fecha_nacimiento: judoka.fecha_nacimiento || null,
        numero_celular: judoka.numero_celular || '',
        ci: judoka.ci || '',
        ci_extension: judoka.ci_extension || '',
        genero: judoka.genero || '',
        categoria: judoka.categoria || '',
        cinturon_actual: judoka.cinturon_actual || '',
        activo: judoka.activo ?? true,
      })
    } else if (isClubManager) {
      // El encargado siempre registra en su propio club; puede elegir el sensei
      reset({
        club_id: user?.club_id || '',
        entrenador_id: '',
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        email: '',
        fecha_nacimiento: null,
        numero_celular: '',
        ci: '',
        ci_extension: '',
        genero: '',
        categoria: '',
        cinturon_actual: '',
        activo: true,
      })
    } else if (isSensei) {
      // El sensei siempre registra en su club y queda asignado a él mismo
      reset({
        club_id: user?.club_id || '',
        entrenador_id: user?.sensei_id || '',
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        email: '',
        fecha_nacimiento: null,
        numero_celular: '',
        ci: '',
        ci_extension: '',
        genero: '',
        categoria: '',
        cinturon_actual: '',
        activo: true,
      })
    }
  }, [judoka, reset, isClubManager, isSensei, user?.club_id, user?.sensei_id])

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <FormInput 
            name="ci" 
            label="Carnet de Identidad" 
            control={control} 
            formatValue={formatCIInput} 
            disabled={loading} 
            inputProps={{ maxLength: 7 }} 
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormInput 
            name="ci_extension" 
            label="Complemento" 
            control={control} 
            formatValue={formatCIExtensionInput}
            disabled={loading} 
            inputProps={{ maxLength: 2 }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormInput 
            name="nombres" 
            label="Nombres" 
            control={control} 
            formatValue={formatNameInput} 
            disabled={loading} 
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput 
            name="apellido_paterno" 
            label="Primer Apellido" 
            control={control} 
            formatValue={formatNameInput} 
            disabled={loading} 
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput 
            name="apellido_materno" 
            label="Segundo Apellido" 
            control={control} 
            formatValue={formatNameInput} 
            disabled={loading} 
          />
        </Grid>
        {!judoka && (
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
            formatValue={formatCelularInput} 
            disabled={loading} 
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
            options={GENDERS_LIST.map(g => ({ value: g, label: g }))} 
            disabled={loading} 
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormAutocomplete
            name="club_id"
            label="Club"
            control={control}
            options={clubes.map(c => ({ value: c.id, label: c.nombre_club }))}
            disabled={loading || loadingClubes || isClubManager || isSensei}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormAutocomplete
            name="entrenador_id"
            label="Sensei / Entrenador"
            control={control}
            options={senseis.map(s => ({ value: s.id, label: s.nombres + ' ' + (s.apellidos || '') }))}
            disabled={loading || loadingSenseis || !watchClubId || isSensei}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormAutocomplete
            name="categoria"
            label="Categoría"
            control={control}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormAutocomplete
            name="cinturon_actual"
            label="Cinturón Actual"
            control={control}
            options={BELT_COLORS.map(c => ({ value: c, label: c }))}
            disabled={loading}
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
          {loading ? <CircularProgress size={20} /> : judoka ? 'Actualizar Judoka' : 'Registrar Judoka'}
        </Button>
      </Box>
    </Box>
  )
}
