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
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'

interface SenseiDetailProps {
  senseiId: string
}

export default function SenseiDetail({ senseiId }: SenseiDetailProps) {
  const [sensei, setSensei] = useState<Sensei | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSensei = async () => {
      setLoading(true)
      setError(null)

      const response = await senseiController.getSenseiById(senseiId)

      if (response.success && response.data) {
        setSensei(response.data)
        
        // Cargar información del club si existe
        if (response.data.club_id) {
          const clubResponse = await clubController.getClubById(response.data.club_id)
          if (clubResponse.success && clubResponse.data) {
            setClub(clubResponse.data)
          }
        }
      } else {
        setError(response.error || 'Error al cargar el sensei')
      }

      setLoading(false)
    }

    if (senseiId) {
      loadSensei()
    }
  }, [senseiId])

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

  if (!sensei) {
    return (
      <Alert severity="warning">
        Sensei no encontrado
      </Alert>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {sensei.nombres} {sensei.apellidos}
        </Typography>
        <Chip 
          label={sensei.activo ? 'Activo' : 'Inactivo'} 
          color={sensei.activo ? 'success' : 'default'}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {club && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Club
            </Typography>
            <Typography variant="body1">
              {club.nombre_club}
            </Typography>
          </Grid>
        )}

        {sensei.fecha_nacimiento && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Fecha de Nacimiento
            </Typography>
            <Typography variant="body1">
              {new Date(sensei.fecha_nacimiento).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </Grid>
        )}

        {sensei.grado_dan && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Grado Dan
            </Typography>
            <Typography variant="body1">
              {sensei.grado_dan}
            </Typography>
          </Grid>
        )}

        {sensei.especialidad && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Especialidad
            </Typography>
            <Typography variant="body1">
              {sensei.especialidad}
            </Typography>
          </Grid>
        )}

        {sensei.certificacion && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Certificación
            </Typography>
            <Typography variant="body1">
              {sensei.certificacion}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fecha de Registro
          </Typography>
          <Typography variant="body1">
            {new Date(sensei.created_at).toLocaleDateString('es-ES', {
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
            {new Date(sensei.updated_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Grid>
      </Grid>

      {/* TODO: Agregar lista de judokas a cargo del sensei */}
    </Paper>
  )
}

