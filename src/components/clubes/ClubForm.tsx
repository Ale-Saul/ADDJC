'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material'
import { Club, ClubCreate, ClubUpdate } from '@/models/club'
import { clubController } from '@/controllers/clubController'

interface ClubFormProps {
  club?: Club | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ClubForm({ club, onSuccess, onCancel }: ClubFormProps) {
  const [formData, setFormData] = useState<ClubCreate | ClubUpdate>({
    nombre_club: '',
    municipio: '',
    direccion: '',
    telefono_contacto: '',
    director_tecnico_id: null,
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (club) {
      setFormData({
        nombre_club: club.nombre_club,
        municipio: club.municipio || '',
        direccion: club.direccion || '',
        telefono_contacto: club.telefono_contacto || '',
        director_tecnico_id: club.director_tecnico_id || null,
        activo: club.activo
      })
    }
  }, [club])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      
      if (club) {
        // Actualizar
        response = await clubController.updateClub(club.id, formData)
      } else {
        // Crear
        response = await clubController.createClub(formData as ClubCreate)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el club')
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
          {club ? 'Club actualizado exitosamente' : 'Club creado exitosamente'}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre del Club"
            name="nombre_club"
            value={formData.nombre_club}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Municipio"
            name="municipio"
            value={formData.municipio}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            multiline
            rows={2}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Teléfono de Contacto"
            name="telefono_contacto"
            value={formData.telefono_contacto}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>

        {/* TODO: Agregar selector de director técnico cuando tengamos la tabla de senseis */}
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
          {loading ? 'Guardando...' : club ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

