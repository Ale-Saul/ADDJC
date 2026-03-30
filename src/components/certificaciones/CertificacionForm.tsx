import { useState, useEffect, useCallback } from 'react'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { FormInput, FormDatePicker } from '@/components/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Certificacion, CertificacionCreate, CertificacionUpdate } from '@/models/certificacion'
import { certificacionController } from '@/controllers/certificacionController'
import { storageService } from '@/services/storageService'

import {
  formatNameInput,
  formatNameWithNumbersInput
} from '@/utils/formatters'

const certificacionSchema = z.object({
  nombre_certificacion: z.string()
    .min(1, 'El nombre es requerido')
    .transform(val => val.trim().replace(/\s+/g, ' ')),
  descripcion: z.string()
    .nullable()
    .optional()
    .transform(val => val ? val.trim().replace(/\s+/g, ' ') : val),
  fecha_emision: z.string().min(1, 'La fecha de emisión es requerida'),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  activo: z.boolean().default(true),
})

interface CertificacionFormProps {
  certificacion?: Certificacion | null
  usuarioId: string
  tipoAfiliado: 'sensei' | 'arbitro'
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CertificacionForm({
  certificacion,
  usuarioId,
  tipoAfiliado,
  onSuccess,
  onCancel
}: CertificacionFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(certificacionSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      nombre_certificacion: '',
      descripcion: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      activo: true,
    },
  })

  useEffect(() => {
    if (certificacion) {
      reset({
        nombre_certificacion: certificacion.nombre_certificacion,
        descripcion: certificacion.descripcion || '',
        fecha_emision: certificacion.fecha_emision ? certificacion.fecha_emision.split('T')[0] : '',
        fecha_vencimiento: certificacion.fecha_vencimiento ? certificacion.fecha_vencimiento.split('T')[0] : '',
        activo: certificacion.activo
      })
      setFilePreview(certificacion.archivo_url)
    }
  }, [certificacion, reset])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Tipo de archivo no permitido. Solo se permiten PDF e imágenes')
        return
      }
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (selectedFile.size > maxSize) {
        setError('El archivo es demasiado grande (máximo 10MB)')
        return
      }
      setFile(selectedFile)
      setError(null)
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => setFilePreview(reader.result as string)
        reader.readAsDataURL(selectedFile)
      } else {
        setFilePreview(null)
      }
    }
  }

  const onSubmit = async (data: z.infer<typeof certificacionSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let archivoUrl = certificacion?.archivo_url || null

      if (file) {
        setUploading(true)
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const path = `certificaciones/${tipoAfiliado}/${usuarioId}_${timestamp}.${fileExtension}`
        const uploadResult = await storageService.uploadFile(file, 'certificaciones', path)
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Error al subir el archivo')
          setLoading(false)
          setUploading(false)
          return
        }
        archivoUrl = storageService.getPublicUrl('certificaciones', path)
        setUploading(false)
      }

      let response
      if (certificacion) {
        response = await certificacionController.updateCertificacion(certificacion.id, {
          ...data,
          archivo_url: archivoUrl
        })
      } else {
        response = await certificacionController.createCertificacion({
          usuario_id: usuarioId,
          tipo_afiliado: tipoAfiliado,
          nombre_certificacion: data.nombre_certificacion,
          descripcion: data.descripcion || null,
          fecha_emision: data.fecha_emision,
          fecha_vencimiento: data.fecha_vencimiento,
          archivo_url: archivoUrl,
          activo: data.activo
        })
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) setTimeout(onSuccess, 1000)
      } else {
        setError(response.error || 'Error al guardar')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{certificacion ? 'Actualizada' : 'Creada'} exitosamente</Alert>}

      <Stack spacing={2}>
          <FormInput
            name="nombre_certificacion"
            control={control}
            label="Nombre de la Certificación"
            required
            disabled={loading || uploading}
            formatValue={formatNameWithNumbersInput}
          />

          <FormInput
            name="descripcion"
            control={control}
            label="Descripción"
            multiline
            rows={3}
            disabled={loading || uploading}
            formatValue={(val) => val.replace(/\s+/g, ' ')}
        />

<FormDatePicker
            name="fecha_emision"
            control={control}
            label="Fecha de Emisión"
            disabled={loading || uploading}
        />

<FormDatePicker
            name="fecha_vencimiento"
            control={control}
            label="Fecha de Vencimiento"
            disabled={loading || uploading}
        />

        <Box>
          <TextField
            fullWidth
            label="Archivo (PDF o Imagen)"
            value={file ? file.name : certificacion?.archivo_url ? 'Archivo actual' : ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Button component="label" variant="text" size="small" disabled={loading || uploading} sx={{ mr: 1, textTransform: 'none' }}>
                  Seleccionar
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} hidden disabled={loading || uploading} />
                </Button>
              )
            }}
            placeholder="Ningún archivo seleccionado"
            disabled={loading || uploading}
          />
          {filePreview && (
            <Box mt={1} textAlign="center">
              {filePreview.startsWith('data:image') || (filePreview.startsWith('http') && !filePreview.toLowerCase().endsWith('.pdf')) ? (
                <img src={filePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #ddd' }} />
              ) : (
                <Button href={filePreview} target="_blank" rel="noopener noreferrer" size="small" variant="outlined">Ver archivo actual</Button>
              )}
            </Box>
          )}
        </Box>
      </Stack>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && <Button variant="outlined" onClick={onCancel} disabled={loading || uploading} sx={{ height: 48 }}>Cancelar</Button>}
        <Button type="submit" variant="contained" disabled={loading || uploading} startIcon={loading || uploading ? <CircularProgress size={20} /> : null} sx={{ height: 48, minWidth: 120 }}>
          {uploading ? 'Subiendo...' : loading ? 'Guardando...' : certificacion ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

