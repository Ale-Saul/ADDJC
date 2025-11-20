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
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'

interface ArbitroListProps {
  onEdit?: (arbitro: Arbitro) => void
  onDelete?: (arbitro: Arbitro) => void
  refreshTrigger?: number
}

export default function ArbitroList({ onEdit, onDelete, refreshTrigger }: ArbitroListProps) {
  const [arbitros, setArbitros] = useState<Arbitro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadArbitros = async () => {
    setLoading(true)
    setError(null)
    
    const response = await arbitroController.getAllArbitros()
    
    if (response.success && response.data) {
      setArbitros(response.data)
    } else {
      setError(response.error || 'Error al cargar los árbitros')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadArbitros()
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

  if (arbitros.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No hay árbitros registrados
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
            <TableCell><strong>Nivel de Arbitraje</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell align="right"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {arbitros.map((arbitro) => (
            <TableRow key={arbitro.id} hover>
              <TableCell>{arbitro.nombres}</TableCell>
              <TableCell>{arbitro.apellidos}</TableCell>
              <TableCell>{arbitro.nivel_arbitraje || '-'}</TableCell>
              <TableCell>
                <Chip 
                  label={arbitro.activo ? 'Activo' : 'Inactivo'} 
                  color={arbitro.activo ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                {onEdit && (
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => onEdit(arbitro)}
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDelete(arbitro)}
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

