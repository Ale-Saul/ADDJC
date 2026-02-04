'use client'

import { useState, useEffect, useMemo } from 'react'
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
import Pagination from '@/components/common/Pagination'

interface ArbitroListProps {
  onEdit?: (arbitro: Arbitro) => void
  onDelete?: (arbitro: Arbitro) => void
  refreshTrigger?: number
  searchTerm?: string
  itemsPerPage?: number
}

export default function ArbitroList({ onEdit, onDelete, refreshTrigger, searchTerm = '', itemsPerPage: initialItemsPerPage = 10 }: ArbitroListProps) {
  const [arbitros, setArbitros] = useState<Arbitro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

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

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Filtrar árbitros según el término de búsqueda
  const filteredArbitros = useMemo(() => {
    if (!searchTerm) return arbitros
    const search = searchTerm.toLowerCase()
    return arbitros.filter((arbitro) => (
      arbitro.nombres?.toLowerCase().includes(search) ||
      arbitro.apellidos?.toLowerCase().includes(search) ||
      arbitro.nivel_arbitraje?.toLowerCase().includes(search)
    ))
  }, [arbitros, searchTerm])

  // Calcular paginación
  const totalPages = Math.ceil(filteredArbitros.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedArbitros = filteredArbitros.slice(startIndex, endIndex)

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

  if (filteredArbitros.length === 0 && searchTerm) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron árbitros que coincidan con "{searchTerm}"
        </Typography>
      </Box>
    )
  }

  return (
    <>
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
            {paginatedArbitros.map((arbitro) => (
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredArbitros.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </>
  )
}

