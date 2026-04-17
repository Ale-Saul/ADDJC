import { useState } from 'react'
import { Controller } from 'react-hook-form'
import {
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Divider,
  Grid,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DescriptionIcon from '@mui/icons-material/Description'
import { Club } from '@/models/club'
import { MUNICIPIOS, CI_EXTENSIONS } from '@/constants/globales'
import { useClubForm } from '@/hooks/useClubForm'
import { formatCIInput, formatCIExtensionInput, formatNameInput, formatCelularInput, formatNameWithNumbersInput } from '@/utils/formatters'
import { FormInput, FormSelect, FormAutocomplete } from '@/components/ui'
import { storageService } from '@/services/storageService'
import { clubController } from '@/controllers/clubController'
import { useAuth } from '@/contexts/AuthContext'

interface ClubFormProps {
  club?: Club
  onSuccess: () => void
  onCancel: () => void
}

export default function ClubForm({ club, onSuccess, onCancel }: ClubFormProps) {
  const { user } = useAuth()
  
  // Manejo de archivos para nuevos clubes
  const [files, setFiles] = useState<{ file: File, nombre: string, tipo: string }[]>([])
  
  const { state, dispatch, control, handleSubmit, onSubmit, errors, isValid, isSubmitting, trigger, senseiOptions } = useClubForm({ 
    club, 
    onSuccess,
    filesCount: files.length
  }); 
  const { loading: submitting, error: submitError, loadingSenseis } = state;

  const [uploadingFiles, setUploadingFiles] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Tipo de archivo no permitido. Solo se permiten PDF e imágenes')
        return
      }
      setFiles(prev => [...prev, { 
        file: selectedFile, 
        nombre: selectedFile.name,
        tipo: selectedFile.type.includes('pdf') ? 'PDF' : 'Imagen'
      }])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleEnhancedSubmit = async (data: any) => {
    try {
      // 1. Primero crear/actualizar el club
      const result = await onSubmit(data)
      
      // Si fue exitoso y es creación y hay archivos para subir
      if (result && (result as any).id) {
        const clubId = (result as any).id
        
        if (!club && files.length > 0) {
          setUploadingFiles(true)
          // 2. Subir cada archivo
          for (const fileItem of files) {
            const timestamp = Date.now()
          const fileExtension = fileItem.file.name.split('.').pop()
          const path = `clubes/${clubId}/${timestamp}_${fileItem.nombre.replace(/\s+/g, '_')}.${fileExtension}`
          
          const uploadResult = await storageService.uploadFile(fileItem.file, 'club-documentos', path)
          
          if (uploadResult.success) {
            const url = storageService.getPublicUrl('club-documentos', path)
            await clubController.addDocument(
                clubId,
                fileItem.nombre,
                url,
                fileItem.tipo,
                user?.id || ''
              )
            }
          }
        }
        // Solo llamar a onSuccess después de que todo esté listo para creación con archivos
        // O si fue una edición (el hook ya lo llamó pero aquí nos aseguramos para creación)
        if (!club) onSuccess()
      }
    } catch (err) {
      console.error('Error al procesar archivos:', err)
    } finally {
      setUploadingFiles(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleEnhancedSubmit)} noValidate sx={{ mt: 1 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput
            name="nombre_club"
            label="Nombre del Club"
            control={control}
            disabled={submitting}
            required
            formatValue={formatNameWithNumbersInput}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormAutocomplete
            name="provincia"
            label="Provincia/Municipio"
            control={control}
            disabled={submitting}
            options={MUNICIPIOS.map(m => ({ value: m, label: m }))}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
            <FormInput
              name="direccion"
              label="Dirección de Entrenamiento"
              control={control}
              disabled={submitting}
              multiline
              rows={2}
              formatValue={formatNameWithNumbersInput}
            />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormInput
            name="telefono_contacto"
            label="Teléfono de Contacto"
            control={control}
            disabled={submitting}
            formatValue={formatCelularInput}
            inputProps={{ 
              maxLength: 8, 
              autoComplete: 'tel',
              name: 'tel_contacto_club',
              id: 'tel_contacto_club'
            }}
            onChange={(e) => {
              // Solo disparar validación si ya tiene 8 dígitos para limpiar el error
              if (e.target.value.length === 8) trigger('telefono_contacto');
            }}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormAutocomplete
            name="director_tecnico_id"
            label="Director Técnico (Sensei/Encargado)"
            control={control}
            disabled={submitting || loadingSenseis || state.isCreatingNewDirector}
            options={senseiOptions}
            required={!state.isCreatingNewDirector}
          />
        </Grid>

        {!club && (
          <Grid size={{ xs: 12 }}>
            <Button 
              type="button" 
              variant="text"
              onClick={() => dispatch({ type: "SET_IS_CREATING_NEW_DIRECTOR", payload: !state.isCreatingNewDirector })}
              sx={{ fontWeight: 'medium' }}
            >
              {state.isCreatingNewDirector ? "CANCELAR NUEVO DIRECTOR TÉCNICO" : "CREAR NUEVO DIRECTOR TÉCNICO"}
            </Button>
          </Grid>
        )}

        {state.isCreatingNewDirector && (
          <Grid size={{ xs: 12 }} container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', textTransform: 'uppercase', mb: 1 }}>
                Datos del Nuevo Director
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 8 }}>
              <FormInput 
                name="new_ci" 
                label="CI del Director Técnico" 
                control={control} 
                disabled={submitting} 
                formatValue={formatCIInput}
                inputProps={{ maxLength: 7 }} 
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormInput 
                name="new_ci_extension" 
                label="Extensión" 
                control={control} 
                disabled={submitting} 
                formatValue={formatCIExtensionInput}
                inputProps={{ maxLength: 2 }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormInput 
                name="new_nombres" 
                label="Nombre del Director Técnico" 
                control={control} 
                disabled={submitting} 
                formatValue={formatNameInput}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormInput 
                name="new_apellido_paterno" 
                label="Primer Apellido" 
                control={control} 
                disabled={submitting} 
                formatValue={formatNameInput}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormInput 
                name="new_apellido_materno" 
                label="Segundo Apellido" 
                control={control} 
                disabled={submitting} 
                formatValue={formatNameInput}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormInput 
                name="new_email" 
                label="Email del Director Técnico" 
                control={control} 
                disabled={submitting} 
                inputProps={{ type: 'email' }}
                required
              />
            </Grid>
          </Grid>
        )}
      </Grid>

      {/* Sección de Documentos (Solo al crear) */}
      {!club && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" />
            Documentos de Respaldo (Opcional)
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  disabled={submitting || uploadingFiles}
                >
                  Seleccionar Archivo
                  <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  PDF o Imágenes (Máx. 10MB)
                </Typography>
              </Box>

              {files.length > 0 && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {files.map((f, index) => (
                    <Box 
                      key={index} 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="space-between"
                      sx={{ p: 1, backgroundColor: 'white', borderRadius: 1, border: '1px solid #eee' }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <DescriptionIcon fontSize="small" color="action" />
                        <Typography variant="body2">{f.nombre}</Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => removeFile(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Box>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || uploadingFiles}
          startIcon={(submitting || uploadingFiles) ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {uploadingFiles ? 'Subiendo archivos...' : submitting ? 'Guardando...' : club ? 'Actualizar Club' : 'Crear Club'}
        </Button>
      </Box>
    </Box>
  )
}
