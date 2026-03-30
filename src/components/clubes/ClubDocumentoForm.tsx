import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { FormInput } from '@/components/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clubController } from '@/controllers/clubController'
import { storageService } from '@/services/storageService'
import { useAuth } from '@/contexts/AuthContext'

const documentoSchema = z.object({
  nombre_documento: z.string().min(1, 'El nombre es requerido'),
  tipo_documento: z.string().nullable().optional(),
})

interface ClubDocumentoFormProps {
  clubId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ClubDocumentoForm({
  clubId,
  onSuccess,
  onCancel
}: ClubDocumentoFormProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(documentoSchema),
    mode: 'onBlur',
    defaultValues: {
      nombre_documento: '',
      tipo_documento: '',
    },
  })

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
    }
  }

  const onSubmit = async (data: z.infer<typeof documentoSchema>) => {
    if (!file) {
      setError('Debe seleccionar un archivo')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      setUploading(true)
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const path = `clubes/${clubId}/${timestamp}.${fileExtension}`
      
      const uploadResult = await storageService.uploadFile(file, 'club-documentos', path)
      
      if (!uploadResult.success) {
        setError(uploadResult.error || 'Error al subir el archivo')
        setLoading(false)
        setUploading(false)
        return
      }

      const archivoUrl = storageService.getPublicUrl('club-documentos', path)
      setUploading(false)

      const response = await clubController.addDocument(
        clubId,
        data.nombre_documento,
        archivoUrl,
        data.tipo_documento || '',
        user?.id || ''
      )

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
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Documento guardado exitosamente</Alert>}

      <Stack spacing={2}>
        <FormInput
          name="nombre_documento"
          control={control}
          label="Nombre del Documento"
          required
          disabled={loading || uploading}
        />

        <FormInput
          name="tipo_documento"
          control={control}
          label="Tipo (ej: Estatuto, Personería)"
          disabled={loading || uploading}
        />

        <Box>
          <TextField
            fullWidth
            label="Archivo (PDF o Imagen)"
            value={file ? file.name : ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Button 
                  component="label" 
                  variant="text" 
                  size="small" 
                  disabled={loading || uploading} 
                  sx={{ mr: 1, textTransform: 'none' }}
                >
                  Seleccionar
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" 
                    onChange={handleFileChange} 
                    hidden 
                    disabled={loading || uploading} 
                  />
                </Button>
              )
            }}
            placeholder="Ningún archivo seleccionado"
            disabled={loading || uploading}
            required
          />
        </Box>
      </Stack>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button 
            variant="outlined" 
            onClick={onCancel} 
            disabled={loading || uploading}
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading || uploading || !file} 
          startIcon={loading || uploading ? <CircularProgress size={20} /> : null}
        >
          {uploading ? 'Subiendo...' : loading ? 'Guardando...' : 'Guardar Documento'}
        </Button>
      </Box>
    </Box>
  )
}
