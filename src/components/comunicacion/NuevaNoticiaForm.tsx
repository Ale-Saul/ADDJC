'use client'

import { useRef, useState } from 'react'
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
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ImageIcon from '@mui/icons-material/Image'
import { FormInput } from '@/components/ui/FormInput'
import { FormSelect } from '@/components/ui/FormSelect'
import { FormDatePicker } from '@/components/ui/FormDatePicker'
import { createNoticiaSchema } from '@/schemas/comunicacionSchema'
import { CATEGORIA_LABELS } from '@/constants/comunicacion'
import { comunicacionService } from '@/services/comunicacionService'
import type { Noticia, NoticiaCreate, ComunicacionAudiencia, ComunicacionCategoria } from '@/models/comunicacion'
import { formatTextoInput } from '@/utils/formatters'
import { ROL } from '@/constants/roles'
import dayjs from 'dayjs'

type FormValues = z.infer<typeof createNoticiaSchema>

const CATEGORIAS: { value: ComunicacionCategoria; label: string }[] = [
  { value: 'evento', label: CATEGORIA_LABELS.evento },
  { value: 'institucional', label: CATEGORIA_LABELS.institucional },
  { value: 'logro', label: CATEGORIA_LABELS.logro },
]

/**
 * Opciones de audiencia visibles en el formulario.
 * - "Encargados" no se muestra como opción independiente.
 * - "Senseis" internamente guarda ['senseis', 'encargados'].
 * - "Para mi club" (solo Encargados) es el alias visual de 'todos'.
 * - "Árbitros" solo Asociación / Admin (no encargados de club).
 */
type AudienciaOpcion = {
  /** valor que aparece en el checkbox (puede diferir del valor DB) */
  id: ComunicacionAudiencia
  label: string
}

function audienciaPermitidaEncargado(audiencia: ComunicacionAudiencia[] | undefined): ComunicacionAudiencia[] {
  const base = audiencia ?? ['todos']
  const sinArbitros = base.filter(a => a !== 'arbitros')
  return sinArbitros.length > 0 ? sinArbitros : ['todos']
}

function getAudienciaOpciones(rol?: string): (AudienciaOpcion & { esGlobal?: boolean })[] {
  const opciones: (AudienciaOpcion & { esGlobal?: boolean })[] = [
    { id: 'todos', label: rol === ROL.ENCARGADO ? 'Para mi club' : 'Todos' },
    { id: 'judokas', label: 'Judokas' },
    { id: 'senseis', label: 'Senseis' },
  ]

  if (rol !== ROL.ENCARGADO) {
    opciones.push({ id: 'arbitros', label: 'Árbitros' })
  }

  if (rol === ROL.ENCARGADO) {
    opciones.push({ id: 'todos', label: 'Noticia Global (Todos los clubes)', esGlobal: true })
  }

  return opciones
}

interface Props {
  autorId: string
  clubId?: string
  rolUsuario?: string
  noticia?: Noticia // Si se pasa, es modo edición
  onSuccess: (data: NoticiaCreate) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

export default function NuevaNoticiaForm({ autorId, clubId, rolUsuario, noticia, onSuccess, onCancel }: Props) {
  const audienciaOpciones = getAudienciaOpciones(rolUsuario)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(noticia?.imagen_url ?? null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createNoticiaSchema),
    defaultValues: {
      autor_id: noticia?.autor_id ?? autorId,
      club_id: noticia?.hasOwnProperty('club_id') ? noticia.club_id : (clubId ?? null),
      titulo: noticia?.titulo ?? '',
      contenido: noticia?.contenido ?? '',
      categoria: noticia?.categoria ?? 'institucional',
      imagen_url: noticia?.imagen_url ?? null,
      es_destacada: noticia?.es_destacada ?? false,
      audiencia:
        rolUsuario === ROL.ENCARGADO
          ? audienciaPermitidaEncargado(noticia?.audiencia)
          : (noticia?.audiencia ?? ['todos']),
      fecha_inicio: noticia?.fecha_inicio ?? dayjs().format('YYYY-MM-DD'),
      fecha_fin: noticia?.fecha_fin ?? null,
    },
  })

  const currentClubId = watch('club_id')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      setUploadError('La imagen no puede superar 5 MB')
      return
    }

    setUploadError(null)
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  const handleRemoveImagen = () => {
    setImagenFile(null)
    setImagenPreview(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (values: FormValues) => {
    setUploadError(null)
    let imagenUrl = noticia?.imagen_url ?? null

    // Subir imagen si se seleccionó una nueva
    if (imagenFile) {
      try {
        console.log('Subiendo imagen...', imagenFile.name)
        imagenUrl = await comunicacionService.uploadImagenNoticia(imagenFile)
        console.log('Imagen subida con éxito:', imagenUrl)
      } catch (err) {
        console.error('Error detallado al subir imagen:', err)
        setUploadError('Error al subir la imagen. Verifica tu conexión e intenta de nuevo.')
        return
      }
    }

    const audienciaFinal =
      rolUsuario === ROL.ENCARGADO
        ? audienciaPermitidaEncargado(values.audiencia)
        : values.audiencia

    const payload: NoticiaCreate = {
      ...values,
      audiencia: audienciaFinal,
      titulo: values.titulo.replace(/\s+/g, ' ').trim(),
      contenido: values.contenido.replace(/\s+/g, ' ').trim(),
      club_id: values.club_id ?? null,
      imagen_url: imagenUrl,
      fecha_fin: values.fecha_fin ?? null,
    }

    console.log('Enviando payload de noticia:', payload)
    const res = await onSuccess(payload)
    if (!res.success) {
      setError('root', { message: res.error ?? `Error al ${noticia ? 'actualizar' : 'crear'} la noticia` })
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

        <FormSelect
          name="categoria"
          control={control}
          label="Categoría *"
          options={CATEGORIAS}
          size="small"
        />

        {/* Imagen de portada */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Imagen de portada (opcional)
          </Typography>

          {imagenPreview ? (
            <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <Box
                component="img"
                src={imagenPreview}
                alt="Vista previa"
                sx={{
                  width: '100%',
                  height: 160,
                  objectFit: 'cover',
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  display: 'block',
                }}
              />
              <IconButton
                size="small"
                onClick={handleRemoveImagen}
                aria-label="Quitar imagen"
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { backgroundColor: 'error.light', color: 'white' },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: uploadError ? 'error.main' : 'divider',
                borderRadius: 1.5,
                py: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 150ms ease, background-color 150ms ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ImageIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Haz clic para seleccionar una imagen
              </Typography>
              <Typography variant="caption" color="text.disabled">
                JPG, PNG, WebP o GIF · Máximo 5 MB
              </Typography>
            </Box>
          )}

          {uploadError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {uploadError}
            </Typography>
          )}

          {/* Input oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>

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
                {audienciaOpciones.map(opcion => {
                  // Lógica para determinar si el checkbox está marcado
                  let isChecked = false
                  if (opcion.id === 'todos') {
                    if (rolUsuario === ROL.ENCARGADO) {
                      if (opcion.esGlobal) {
                        // "Noticia Global" está marcado si club_id es null
                        isChecked = currentClubId === null
                      } else {
                        // "Para mi club" está marcado si club_id tiene valor Y audiencia incluye 'todos'
                        isChecked = currentClubId !== null && (field.value?.includes('todos') ?? false)
                      }
                    } else {
                      // Para otros roles (Asociación/Admin), 'todos' es simplemente si está en el array
                      isChecked = field.value?.includes('todos') ?? false
                    }
                  } else if (opcion.id === 'senseis') {
                    isChecked = field.value?.includes('senseis') ?? false
                  } else {
                    isChecked = field.value?.includes(opcion.id) ?? false
                  }

                  return (
                    <FormControlLabel
                      key={opcion.esGlobal ? 'global' : opcion.id}
                      label={opcion.label}
                      control={
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={e => {
                            const current = field.value ?? []
                            if (e.target.checked) {
                              if (rolUsuario === ROL.ENCARGADO) {
                                if (opcion.esGlobal) {
                                  // Al elegir Global, quitamos club_id y ponemos audiencia 'todos'
                                  setValue('club_id', null)
                                  field.onChange(['todos'])
                                } else if (opcion.id === 'todos') {
                                  // Al elegir "Para mi club", restauramos clubId original y ponemos audiencia 'todos'
                                  // IMPORTANTE: clubId es el ID del club del encargado pasado por props
                                  setValue('club_id', clubId ?? null)
                                  field.onChange(['todos'])
                                } else if (opcion.id === 'senseis') {
                                  // Senseis incluye automáticamente encargados
                                  const sinTodos = current.filter(a => a !== 'todos')
                                  const nuevo = Array.from(new Set([...sinTodos, 'senseis', 'encargados']))
                                  field.onChange(nuevo)
                                  // Si estaba en global, al elegir algo específico vuelve a ser de su club
                                  if (currentClubId === null && clubId) setValue('club_id', clubId)
                                } else {
                                  field.onChange([...current.filter(a => a !== 'todos'), opcion.id])
                                  // Si estaba en global, al elegir algo específico vuelve a ser de su club
                                  if (currentClubId === null && clubId) setValue('club_id', clubId)
                                }
                              } else {
                                // Lógica para Asociación / Admin
                                if (opcion.id === 'todos') {
                                  field.onChange(['todos'])
                                } else {
                                  field.onChange([...current.filter(a => a !== 'todos'), opcion.id])
                                }
                              }
                            } else {
                              if (opcion.id === 'senseis') {
                                field.onChange(current.filter(a => a !== 'senseis' && a !== 'encargados'))
                              } else {
                                field.onChange(current.filter(a => a !== opcion.id))
                              }
                            }
                          }}
                        />
                      }
                    />
                  )
                })}
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
            startIcon={isSubmitting
              ? <CircularProgress size={16} color="inherit" />
              : <UploadFileIcon />
            }
            sx={{ minHeight: 44 }}
          >
            {isSubmitting ? (noticia ? 'Guardando…' : 'Publicando…') : (noticia ? 'Guardar cambios' : 'Publicar noticia')}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
