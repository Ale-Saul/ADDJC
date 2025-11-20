'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'

interface SenseiFormProps {
  sensei?: Sensei | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function SenseiForm({ sensei, onSuccess, onCancel }: SenseiFormProps) {
  const [formData, setFormData] = useState<SenseiCreate | SenseiUpdate>({
    usuario_id: '',
    club_id: null,
    nombres: '',
    apellidos: '',
    fecha_nacimiento: null,
    grado_dan: '',
    certificacion: '',
    especialidad: '',
    foto_perfil: null,
    activo: true
  })
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Cargar clubes activos
    const loadClubes = async () => {
      const response = await clubController.getAllClubes(false)
      if (response.success && response.data) {
        setClubes(response.data)
      }
      setLoadingClubes(false)
    }
    loadClubes()
  }, [])

  useEffect(() => {
    if (sensei) {
      setFormData({
        club_id: sensei.club_id || null,
        nombres: sensei.nombres,
        apellidos: sensei.apellidos,
        fecha_nacimiento: sensei.fecha_nacimiento || null,
        grado_dan: sensei.grado_dan || '',
        certificacion: sensei.certificacion || '',
        especialidad: sensei.especialidad || '',
        foto_perfil: sensei.foto_perfil || null,
        activo: sensei.activo
      })
    }
  }, [sensei])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value || null
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let response
      
      if (sensei) {
        // Actualizar
        response = await senseiController.updateSensei(sensei.id, formData)
      } else {
        // Crear - El servicio creará automáticamente el usuario y perfil
        const createData: SenseiCreate = {
          ...formData as SenseiCreate,
          usuario_id: 'temp-user-id' // El servicio lo reemplazará automáticamente
        }
        response = await senseiController.createSensei(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el sensei')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
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
          {sensei ? 'Sensei actualizado exitosamente' : 'Sensei creado exitosamente'}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Club</InputLabel>
            <Select
              name="club_id"
              value={formData.club_id || ''}
              onChange={handleSelectChange}
              disabled={loading || loadingClubes}
              label="Club"
            >
              <MenuItem value="">
                <em>Sin club</em>
              </MenuItem>
              {clubes.map((club) => (
                <MenuItem key={club.id} value={club.id}>
                  {club.nombre_club}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nombres"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Apellidos"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Fecha de Nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={formData.fecha_nacimiento || ''}
            onChange={handleChange}
            disabled={loading}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Grado Dan"
            name="grado_dan"
            value={formData.grado_dan || ''}
            onChange={handleChange}
            disabled={loading}
            placeholder="Ej: 1er Dan, 2do Dan, etc."
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Especialidad"
            name="especialidad"
            value={formData.especialidad || ''}
            onChange={handleChange}
            disabled={loading}
            placeholder="Área de especialización del sensei"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Certificación"
            name="certificacion"
            value={formData.certificacion || ''}
            onChange={handleChange}
            multiline
            rows={3}
            disabled={loading}
            placeholder="Detalles sobre la certificación del sensei"
          />
        </Grid>

        {/* TODO: Agregar campo para subir foto_perfil */}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : sensei ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

