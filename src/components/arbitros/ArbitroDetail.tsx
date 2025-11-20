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
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'

interface ArbitroDetailProps {
  arbitroId: string
}

export default function ArbitroDetail({ arbitroId }: ArbitroDetailProps) {
  const [arbitro, setArbitro] = useState<Arbitro | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadArbitro = async () => {
      setLoading(true)
      setError(null)

      const response = await arbitroController.getArbitroById(arbitroId)

      if (response.success && response.data) {
        setArbitro(response.data)
      } else {
        setError(response.error || 'Error al cargar el árbitro')
      }

      setLoading(false)
    }

    if (arbitroId) {
      loadArbitro()
    }
  }, [arbitroId])

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

  if (!arbitro) {
    return (
      <Alert severity="warning">
        Árbitro no encontrado
      </Alert>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {arbitro.nombres} {arbitro.apellidos}
        </Typography>
        <Chip 
          label={arbitro.activo ? 'Activo' : 'Inactivo'} 
          color={arbitro.activo ? 'success' : 'default'}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {arbitro.fecha_nacimiento && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Fecha de Nacimiento
            </Typography>
            <Typography variant="body1">
              {new Date(arbitro.fecha_nacimiento).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </Grid>
        )}

        {arbitro.nivel_arbitraje && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Nivel de Arbitraje
            </Typography>
            <Typography variant="body1">
              {arbitro.nivel_arbitraje}
            </Typography>
          </Grid>
        )}

        {arbitro.certificacion && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Certificación
            </Typography>
            <Typography variant="body1">
              {arbitro.certificacion}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fecha de Registro
          </Typography>
          <Typography variant="body1">
            {new Date(arbitro.created_at).toLocaleDateString('es-ES', {
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
            {new Date(arbitro.updated_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  )
}

