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
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'

interface SenseiListProps {
  onEdit?: (sensei: Sensei) => void
  onDelete?: (sensei: Sensei) => void
  refreshTrigger?: number
  clubId?: string // Opcional: filtrar por club
}

export default function SenseiList({ onEdit, onDelete, refreshTrigger, clubId }: SenseiListProps) {
  const [senseis, setSenseis] = useState<Sensei[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSenseis = async () => {
    setLoading(true)
    setError(null)
    
    const response = clubId 
      ? await senseiController.getSenseisByClub(clubId)
      : await senseiController.getAllSenseis()
    
    if (response.success && response.data) {
      setSenseis(response.data)
    } else {
      setError(response.error || 'Error al cargar los senseis')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadSenseis()
  }, [refreshTrigger, clubId])

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

  if (senseis.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No hay senseis registrados
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
            <TableCell><strong>Grado Dan</strong></TableCell>
            <TableCell><strong>Especialidad</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell align="right"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {senseis.map((sensei) => (
            <TableRow key={sensei.id} hover>
              <TableCell>{sensei.nombres}</TableCell>
              <TableCell>{sensei.apellidos}</TableCell>
              <TableCell>{sensei.grado_dan || '-'}</TableCell>
              <TableCell>{sensei.especialidad || '-'}</TableCell>
              <TableCell>
                <Chip 
                  label={sensei.activo ? 'Activo' : 'Inactivo'} 
                  color={sensei.activo ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                {onEdit && (
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => onEdit(sensei)}
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDelete(sensei)}
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

