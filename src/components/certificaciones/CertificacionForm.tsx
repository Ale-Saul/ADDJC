'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Certificacion, CertificacionCreate, CertificacionUpdate } from '@/models/certificacion'
import { certificacionController } from '@/controllers/certificacionController'
import { storageService } from '@/services/storageService'

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
  const [formData, setFormData] = useState<CertificacionCreate | CertificacionUpdate>({
    nombre_certificacion: '',
    descripcion: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    archivo_url: null,
    activo: true
  })
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (certificacion) {
      setFormData({
        nombre_certificacion: certificacion.nombre_certificacion,
        descripcion: certificacion.descripcion || '',
        fecha_emision: certificacion.fecha_emision ? certificacion.fecha_emision.split('T')[0] : '',
        fecha_vencimiento: certificacion.fecha_vencimiento ? certificacion.fecha_vencimiento.split('T')[0] : '',
        archivo_url: certificacion.archivo_url,
        activo: certificacion.activo
      })
      setFilePreview(certificacion.archivo_url)
    }
  }, [certificacion])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ]

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Tipo de archivo no permitido. Solo se permiten PDF e imágenes (JPG, PNG, GIF, WEBP)')
        return
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (selectedFile.size > maxSize) {
        setError('El archivo es demasiado grande. El tamaño máximo es 10MB')
        return
      }

      setFile(selectedFile)
      setError(null)

      // Crear preview para imágenes
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let archivoUrl = formData.archivo_url || null

      // Si hay un archivo nuevo, subirlo primero
      if (file) {
        setUploading(true)
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const fileName = `${usuarioId}_${timestamp}.${fileExtension}`
        const path = `certificaciones/${tipoAfiliado}/${fileName}`

        const uploadResult = await storageService.uploadFile(file, 'certificaciones', path)

        if (!uploadResult.success) {
          setError(uploadResult.error || 'Error al subir el archivo')
          setLoading(false)
          setUploading(false)
          return
        }

        archivoUrl = uploadResult.url || null
        setUploading(false)
      }

      let response

      if (certificacion) {
        // Actualizar
        response = await certificacionController.updateCertificacion(certificacion.id, {
          ...formData,
          archivo_url: archivoUrl
        })
      } else {
        // Crear
        response = await certificacionController.createCertificacion({
          usuario_id: usuarioId,
          tipo_afiliado: tipoAfiliado,
          nombre_certificacion: formData.nombre_certificacion!,
          descripcion: formData.descripcion || null,
          fecha_emision: formData.fecha_emision || null,
          fecha_vencimiento: formData.fecha_vencimiento || null,
          archivo_url: archivoUrl,
          activo: formData.activo ?? true
        })
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar la certificación')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado'
      setError(errorMessage)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {certificacion ? 'Certificación actualizada exitosamente' : 'Certificación creada exitosamente'}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Nombre de la Certificación"
          name="nombre_certificacion"
          value={formData.nombre_certificacion}
          onChange={handleChange}
          required
          disabled={loading || uploading}
        />

        <TextField
          fullWidth
          label="Descripción"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          multiline
          rows={3}
          disabled={loading || uploading}
        />

        <TextField
          fullWidth
          label="Fecha de Emisión"
          name="fecha_emision"
          type="date"
          value={formData.fecha_emision}
          onChange={handleChange}
          InputLabelProps={{
            shrink: true
          }}
          disabled={loading || uploading}
        />

        <TextField
          fullWidth
          label="Fecha de Vencimiento"
          name="fecha_vencimiento"
          type="date"
          value={formData.fecha_vencimiento}
          onChange={handleChange}
          InputLabelProps={{
            shrink: true
          }}
          disabled={loading || uploading}
        />

        <Box>
          <TextField
            fullWidth
            label="Archivo (PDF o Imagen - Máximo 10MB)"
            value={file ? file.name : certificacion?.archivo_url ? 'Archivo actual' : ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Button
                  component="label"
                  variant="text"
                  size="small"
                  disabled={loading || uploading}
                  sx={{ 
                    mr: 1,
                    minWidth: 'auto',
                    textTransform: 'none'
                  }}
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
            placeholder={file ? file.name : certificacion?.archivo_url ? 'Archivo actual' : 'Ningún archivo seleccionado'}
            disabled={loading || uploading}
          />
          {filePreview && (
            <Box mt={1}>
              {filePreview.startsWith('data:image') ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                />
              ) : filePreview.startsWith('http') ? (
                <Button
                  href={filePreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                >
                  Ver archivo actual
                </Button>
              ) : null}
            </Box>
          )}
        </Box>

        <FormControl fullWidth>
          <InputLabel>Estado</InputLabel>
          <Select
            name="activo"
            value={formData.activo ? 'true' : 'false'}
            onChange={(e: SelectChangeEvent) => {
              setFormData(prev => ({
                ...prev,
                activo: e.target.value === 'true'
              }))
            }}
            label="Estado"
            disabled={loading || uploading}
          >
            <MenuItem value="true">Activa</MenuItem>
            <MenuItem value="false">Inactiva</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={loading || uploading}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading || uploading}
          startIcon={loading || uploading ? <CircularProgress size={20} /> : null}
        >
          {uploading
            ? 'Subiendo archivo...'
            : loading
            ? 'Guardando...'
            : certificacion
            ? 'Actualizar'
            : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

