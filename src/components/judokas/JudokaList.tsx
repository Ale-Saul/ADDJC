'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'

interface JudokaListProps {
  onEdit?: (judoka: Judoka) => void
  onDelete?: (judoka: Judoka) => void
  onView?: (judoka: Judoka) => void
  refreshTrigger?: number
  clubId?: string // Opcional: filtrar por club
  entrenadorId?: string // Opcional: filtrar por entrenador
}

export default function JudokaList({ onEdit, onDelete, onView, refreshTrigger, clubId, entrenadorId }: JudokaListProps) {
  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadJudokas = async () => {
    setLoading(true)
    setError(null)
    
    let response
    if (clubId) {
      response = await judokaController.getJudokasByClub(clubId)
    } else if (entrenadorId) {
      response = await judokaController.getJudokasByEntrenador(entrenadorId)
    } else {
      response = await judokaController.getAllJudokas()
    }
    
    if (response.success && response.data) {
      setJudokas(response.data)
    } else {
      setError(response.error || 'Error al cargar los judokas')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadJudokas()
  }, [refreshTrigger, clubId, entrenadorId])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (judokas.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No hay judokas registrados
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Nombres</strong></TableCell>
            <TableCell><strong>Apellidos</strong></TableCell>
            <TableCell><strong>Categoría</strong></TableCell>
            <TableCell><strong>Cinturón</strong></TableCell>
            <TableCell><strong>Peso (kg)</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell align="right"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {judokas.map((judoka) => (
            <TableRow key={judoka.id} hover>
              <TableCell>{judoka.nombres}</TableCell>
              <TableCell>{judoka.apellidos}</TableCell>
              <TableCell>{judoka.categoria || '-'}</TableCell>
              <TableCell>{judoka.cinturon_actual || '-'}</TableCell>
              <TableCell>{judoka.peso_competitivo ? `${judoka.peso_competitivo} kg` : '-'}</TableCell>
              <TableCell>
                <Chip 
                  label={judoka.activo ? 'Activo' : 'Inactivo'} 
                  color={judoka.activo ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                {onView && (
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => onView(judoka)}
                    title="Ver detalle"
                  >
                    <VisibilityIcon />
                  </IconButton>
                )}
                {onEdit && (
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => onEdit(judoka)}
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDelete(judoka)}
                    title="Eliminar"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

