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
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import Pagination from '@/components/common/Pagination'

interface SenseiListProps {
  onEdit?: (sensei: Sensei) => void
  onDelete?: (sensei: Sensei) => void
  refreshTrigger?: number
  clubId?: string // Opcional: filtrar por club
  searchTerm?: string
  itemsPerPage?: number
}

export default function SenseiList({ onEdit, onDelete, refreshTrigger, clubId, searchTerm = '', itemsPerPage: initialItemsPerPage = 10 }: SenseiListProps) {
  const [senseis, setSenseis] = useState<Sensei[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

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

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Filtrar senseis según el término de búsqueda
  const filteredSenseis = useMemo(() => {
    if (!searchTerm) return senseis
    const search = searchTerm.toLowerCase()
    return senseis.filter((sensei) => (
      sensei.nombres?.toLowerCase().includes(search) ||
      sensei.apellidos?.toLowerCase().includes(search) ||
      sensei.grado_dan?.toLowerCase().includes(search) ||
      sensei.especialidad?.toLowerCase().includes(search)
    ))
  }, [senseis, searchTerm])

  // Calcular paginación
  const totalPages = Math.ceil(filteredSenseis.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSenseis = filteredSenseis.slice(startIndex, endIndex)

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

  if (filteredSenseis.length === 0 && searchTerm) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron senseis que coincidan con "{searchTerm}"
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
              <TableCell><strong>Grado Dan</strong></TableCell>
              <TableCell><strong>Especialidad</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSenseis.map((sensei) => (
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredSenseis.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </>
  )
}

