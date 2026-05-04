'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Stack,
  Button,
  Alert,
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
} from '@mui/material'
import { FormInput } from '@/components/ui/FormInput'
import { FormSelect } from '@/components/ui/FormSelect'
import { FormDatePicker } from '@/components/ui/FormDatePicker'
import { createNoticiaSchema } from '@/schemas/comunicacionSchema'
import { CATEGORIA_LABELS, AUDIENCIA_LABELS } from '@/constants/comunicacion'
import type { NoticiaCreate, ComunicacionAudiencia, ComunicacionCategoria } from '@/models/comunicacion'
import { formatTextoInput } from '@/utils/formatters'
import dayjs from 'dayjs'

type FormValues = z.infer<typeof createNoticiaSchema>

const CATEGORIAS: { value: ComunicacionCategoria; label: string }[] = [
  { value: 'evento', label: CATEGORIA_LABELS.evento },
  { value: 'institucional', label: CATEGORIA_LABELS.institucional },
  { value: 'logro', label: CATEGORIA_LABELS.logro },
]

const AUDIENCIAS: ComunicacionAudiencia[] = ['todos', 'judokas', 'senseis', 'arbitros', 'encargados']

interface Props {
  autorId: string
  clubId?: string
  onSuccess: (data: NoticiaCreate) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

export default function NuevaNoticiaForm({ autorId, clubId, onSuccess, onCancel }: Props) {
  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createNoticiaSchema),
    defaultValues: {
      autor_id: autorId,
      club_id: clubId ?? null,
      titulo: '',
      contenido: '',
      categoria: 'institucional',
      imagen_url: null,
      es_destacada: false,
      audiencia: ['todos'],
      fecha_inicio: dayjs().format('YYYY-MM-DD'),
      fecha_fin: null,
    },
  })

  const audienciaActual = watch('audiencia') ?? []

  const onSubmit = async (values: FormValues) => {
    const payload: NoticiaCreate = {
      ...values,
      titulo: values.titulo.replace(/\s+/g, ' ').trim(),
      contenido: values.contenido.replace(/\s+/g, ' ').trim(),
      club_id: values.club_id ?? null,
      imagen_url: values.imagen_url ?? null,
      fecha_fin: values.fecha_fin ?? null,
    }
    const res = await onSuccess(payload)
    if (!res.success) {
      setError('root', { message: res.error ?? 'Error al crear la noticia' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {errors.root && (
          <Alert severity="error" role="alert">{errors.root.message}</Alert>
        )}

        <FormInput
          name="titulo"
          control={control}
          label="Título *"
          placeholder="Ej: Gran actuación en el Departamental"
          size="small"
          formatValue={formatTextoInput}
          inputProps={{ maxLength: 100 }}
        />

        <FormInput
          name="contenido"
          control={control}
          label="Contenido *"
          multiline
          rows={4}
          size="small"
          formatValue={formatTextoInput}
          placeholder="Describe el anuncio con detalle..."
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormSelect
            name="categoria"
            control={control}
            label="Categoría *"
            options={CATEGORIAS}
            size="small"
          />

          <FormInput
            name="imagen_url"
            control={control}
            label="URL de imagen (opcional)"
            placeholder="https://..."
            size="small"
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormDatePicker
            name="fecha_inicio"
            control={control}
            label="Fecha de inicio *"
          />
          <FormDatePicker
            name="fecha_fin"
            control={control}
            label="Fecha de fin (opcional)"
            minDate={dayjs()}
          />
        </Stack>

        {/* Audiencia */}
        <Controller
          name="audiencia"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl error={!!fieldState.error} component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                Audiencia *
              </FormLabel>
              <FormGroup row>
                {AUDIENCIAS.map(aud => (
                  <FormControlLabel
                    key={aud}
                    label={AUDIENCIA_LABELS[aud]}
                    control={
                      <Checkbox
                        size="small"
                        checked={field.value?.includes(aud) ?? false}
                        onChange={e => {
                          const current = field.value ?? []
                          field.onChange(
                            e.target.checked
                              ? [...current, aud]
                              : current.filter(a => a !== aud)
                          )
                        }}
                      />
                    }
                  />
                ))}
              </FormGroup>
              {fieldState.error && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />

        {/* Destacada */}
        <Controller
          name="es_destacada"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                  size="small"
                />
              }
              label="Marcar como noticia destacada (aparece en el Dashboard)"
            />
          )}
        />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isSubmitting}
            sx={{ minHeight: 44 }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minHeight: 44 }}
          >
            {isSubmitting ? 'Publicando…' : 'Publicar noticia'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
