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
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import Pagination from '@/components/common/Pagination'

interface ClubListProps {
  onEdit?: (club: Club) => void
  onDelete?: (club: Club) => void
  refreshTrigger?: number
  searchTerm?: string
  itemsPerPage?: number
}

export default function ClubList({ onEdit, onDelete, refreshTrigger, searchTerm = '', itemsPerPage: initialItemsPerPage = 10 }: ClubListProps) {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

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

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Filtrar clubes según el término de búsqueda
  const filteredClubes = useMemo(() => {
    if (!searchTerm) return clubes
    const search = searchTerm.toLowerCase()
    return clubes.filter((club) => (
      club.nombre_club?.toLowerCase().includes(search) ||
      club.municipio?.toLowerCase().includes(search) ||
      club.direccion?.toLowerCase().includes(search) ||
      club.telefono_contacto?.toLowerCase().includes(search)
    ))
  }, [clubes, searchTerm])

  // Calcular paginación
  const totalPages = Math.ceil(filteredClubes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClubes = filteredClubes.slice(startIndex, endIndex)

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

  if (filteredClubes.length === 0 && searchTerm) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron clubes que coincidan con "{searchTerm}"
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
              <TableCell><strong>Nombre del Club</strong></TableCell>
              <TableCell><strong>Municipio</strong></TableCell>
              <TableCell><strong>Teléfono</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedClubes.map((club) => (
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredClubes.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </>
  )
}

