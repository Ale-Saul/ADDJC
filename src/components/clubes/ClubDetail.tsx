'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material'
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'

interface ClubDetailProps {
  clubId: string
}

export default function ClubDetail({ clubId }: ClubDetailProps) {
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadClub = async () => {
      setLoading(true)
      setError(null)

      const response = await clubController.getClubById(clubId)

      if (response.success && response.data) {
        setClub(response.data)
      } else {
        setError(response.error || 'Error al cargar el club')
      }

      setLoading(false)
    }

    if (clubId) {
      loadClub()
    }
  }, [clubId])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    )
  }

  if (!club) {
    return (
      <Alert severity="warning">
        Club no encontrado
      </Alert>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {club.nombre_club}
        </Typography>
        <Chip 
          label={club.activo ? 'Activo' : 'Inactivo'} 
          color={club.activo ? 'success' : 'default'}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {club.municipio && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Municipio
            </Typography>
            <Typography variant="body1">
              {club.municipio}
            </Typography>
          </Grid>
        )}

        {club.telefono_contacto && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Teléfono de Contacto
            </Typography>
            <Typography variant="body1">
              {club.telefono_contacto}
            </Typography>
          </Grid>
        )}

        {club.direccion && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Dirección
            </Typography>
            <Typography variant="body1">
              {club.direccion}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fecha de Creación
          </Typography>
          <Typography variant="body1">
            {new Date(club.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Última Actualización
          </Typography>
          <Typography variant="body1">
            {new Date(club.updated_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Grid>
      </Grid>

      {/* TODO: Agregar información del director técnico cuando tengamos la relación */}
      {/* TODO: Agregar lista de senseis y judokas del club */}
    </Paper>
  )
}

