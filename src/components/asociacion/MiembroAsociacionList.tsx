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
import { MiembroAsociacion } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import Pagination from '@/components/common/Pagination'

interface MiembroAsociacionListProps {
  onEdit?: (miembro: MiembroAsociacion) => void
  onDelete?: (miembro: MiembroAsociacion) => void
  refreshTrigger?: number
  searchTerm?: string
  itemsPerPage?: number
}

export default function MiembroAsociacionList({ 
  onEdit, 
  onDelete, 
  refreshTrigger, 
  searchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10 
}: MiembroAsociacionListProps) {
  const [miembros, setMiembros] = useState<MiembroAsociacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const loadMiembros = async () => {
    setLoading(true)
    setError(null)
    
    const response = await asociacionController.getAllMiembros()
    
    if (response.success && response.data) {
      setMiembros(response.data)
    } else {
      setError(response.error || 'Error al cargar los miembros')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadMiembros()
  }, [refreshTrigger])

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Filtrar miembros según el término de búsqueda
  const filteredMiembros = useMemo(() => {
    if (!searchTerm) return miembros
    const search = searchTerm.toLowerCase()
    return miembros.filter((miembro) => (
      miembro.nombres?.toLowerCase().includes(search) ||
      miembro.apellidos?.toLowerCase().includes(search) ||
      miembro.email?.toLowerCase().includes(search)
    ))
  }, [miembros, searchTerm])

  // Calcular paginación
  const totalPages = Math.ceil(filteredMiembros.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMiembros = filteredMiembros.slice(startIndex, endIndex)

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

  if (miembros.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No hay miembros de la asociación registrados
        </Typography>
      </Box>
    )
  }

  if (filteredMiembros.length === 0 && searchTerm) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron miembros que coincidan con "{searchTerm}"
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
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMiembros.map((miembro) => (
              <TableRow key={miembro.id} hover>
                <TableCell>{miembro.nombres}</TableCell>
                <TableCell>{miembro.apellidos}</TableCell>
                <TableCell>{miembro.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={miembro.activo ? 'Activo' : 'Inactivo'} 
                    color={miembro.activo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {onEdit && (
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => onEdit(miembro)}
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => onDelete(miembro)}
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
        totalItems={filteredMiembros.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </>
  )
}

