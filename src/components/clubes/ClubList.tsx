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
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'

interface ClubListProps {
  onEdit?: (club: Club) => void
  onDelete?: (club: Club) => void
  refreshTrigger?: number
}

export default function ClubList({ onEdit, onDelete, refreshTrigger }: ClubListProps) {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClubes = async () => {
    setLoading(true)
    setError(null)
    
    const response = await clubController.getAllClubes()
    
    if (response.success && response.data) {
      setClubes(response.data)
    } else {
      setError(response.error || 'Error al cargar los clubes')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadClubes()
  }, [refreshTrigger])

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

  if (clubes.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No hay clubes registrados
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Nombre del Club</strong></TableCell>
            <TableCell><strong>Municipio</strong></TableCell>
            <TableCell><strong>Teléfono</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell align="right"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clubes.map((club) => (
            <TableRow key={club.id} hover>
              <TableCell>{club.nombre_club}</TableCell>
              <TableCell>{club.municipio || '-'}</TableCell>
              <TableCell>{club.telefono_contacto || '-'}</TableCell>
              <TableCell>
                <Chip 
                  label={club.activo ? 'Activo' : 'Inactivo'} 
                  color={club.activo ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                {onEdit && (
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => onEdit(club)}
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDelete(club)}
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

