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
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { Club } from '@/models/club'
import { Sensei } from '@/models/sensei'

interface JudokaDetailProps {
  judokaId: string
}

export default function JudokaDetail({ judokaId }: JudokaDetailProps) {
  const [judoka, setJudoka] = useState<Judoka | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [sensei, setSensei] = useState<Sensei | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJudoka = async () => {
      setLoading(true)
      setError(null)

      const response = await judokaController.getJudokaById(judokaId)

      if (response.success && response.data) {
        setJudoka(response.data)
        
        // Cargar información del club si existe
        if (response.data.club_id) {
          const clubResponse = await clubController.getClubById(response.data.club_id)
          if (clubResponse.success && clubResponse.data) {
            setClub(clubResponse.data)
          }
        }

        // Cargar información del entrenador si existe
        if (response.data.entrenador_id) {
          // Buscar el sensei por usuario_id (entrenador_id en judokas = usuario_id en senseis)
          const senseisResponse = await senseiController.getAllSenseis(true)
          if (senseisResponse.success && senseisResponse.data) {
            const foundSensei = senseisResponse.data.find(s => s.usuario_id === response.data.entrenador_id)
            if (foundSensei) {
              setSensei(foundSensei)
            }
          }
        }
      } else {
        setError(response.error || 'Error al cargar el judoka')
      }

      setLoading(false)
    }

    if (judokaId) {
      loadJudoka()
    }
  }, [judokaId])

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

  if (!judoka) {
    return (
      <Alert severity="warning">
        Judoka no encontrado
      </Alert>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {judoka.nombres} {judoka.apellidos}
        </Typography>
        <Chip 
          label={judoka.activo ? 'Activo' : 'Inactivo'} 
          color={judoka.activo ? 'success' : 'default'}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {club && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Club
            </Typography>
            <Typography variant="body1">
              {club.nombre_club}
            </Typography>
          </Grid>
        )}

        {sensei && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Entrenador
            </Typography>
            <Typography variant="body1">
              {sensei.nombres} {sensei.apellidos}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fecha de Nacimiento
          </Typography>
          <Typography variant="body1">
            {new Date(judoka.fecha_nacimiento).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Grid>

        {judoka.categoria && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Categoría
            </Typography>
            <Typography variant="body1">
              {judoka.categoria}
            </Typography>
          </Grid>
        )}

        {judoka.cinturon_actual && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cinturón Actual
            </Typography>
            <Typography variant="body1">
              {judoka.cinturon_actual}
            </Typography>
          </Grid>
        )}

        {judoka.peso_competitivo && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Peso Competitivo
            </Typography>
            <Typography variant="body1">
              {judoka.peso_competitivo} kg
            </Typography>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fecha de Registro
          </Typography>
          <Typography variant="body1">
            {new Date(judoka.created_at).toLocaleDateString('es-ES', {
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
            {new Date(judoka.updated_at).toLocaleDateString('es-ES', {
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

