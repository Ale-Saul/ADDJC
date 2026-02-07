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
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import Pagination from '@/components/common/Pagination'

interface JudokaListProps {
  judokas?: Judoka[] // Opcional: recibir judokas directamente
  isLoading?: boolean // Opcional: estado de carga externo
  onEdit?: (judoka: Judoka) => void
  onDelete?: (judoka: Judoka) => void
  refreshTrigger?: number
  clubId?: string // Opcional: filtrar por club
  entrenadorId?: string // Opcional: filtrar por entrenador
  searchTerm?: string
  itemsPerPage?: number
}

export default function JudokaList({ judokas: judokasProp, isLoading: isLoadingProp, onEdit, onDelete, refreshTrigger, clubId, entrenadorId, searchTerm = '', itemsPerPage: initialItemsPerPage = 10 }: JudokaListProps) {
  const [judokasLocal, setJudokasLocal] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

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
      setJudokasLocal(response.data)
    } else {
      setError(response.error || 'Error al cargar los judokas')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    // Solo cargar judokas si no se reciben por prop
    if (!judokasProp) {
      loadJudokas()
    }
  }, [refreshTrigger, clubId, entrenadorId, judokasProp])

  // Usar judokas de prop si están disponibles, sino usar los locales
  const judokas = judokasProp || judokasLocal
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : loading

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Filtrar judokas según el término de búsqueda
  const filteredJudokas = useMemo(() => {
    if (!searchTerm) return judokas
    const search = searchTerm.toLowerCase()
    return judokas.filter((judoka) => (
      judoka.nombres?.toLowerCase().includes(search) ||
      judoka.apellidos?.toLowerCase().includes(search) ||
      judoka.categoria?.toLowerCase().includes(search) ||
      judoka.cinturon_actual?.toLowerCase().includes(search)
    ))
  }, [judokas, searchTerm])

  // Calcular paginación
  const totalPages = Math.max(1, Math.ceil(filteredJudokas.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedJudokas = filteredJudokas.slice(startIndex, endIndex)
  
  // Asegurar que currentPage no exceda totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  if (isLoading) {
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

  if (filteredJudokas.length === 0 && searchTerm) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron judokas que coincidan con "{searchTerm}"
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
              <TableCell><strong>Categoría</strong></TableCell>
              <TableCell><strong>Cinturón</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedJudokas.map((judoka) => (
              <TableRow key={judoka.id} hover>
                <TableCell>{judoka.nombres}</TableCell>
                <TableCell>{judoka.apellidos}</TableCell>
                <TableCell>{judoka.categoria || '-'}</TableCell>
                <TableCell>{judoka.cinturon_actual || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={judoka.activo ? 'Activo' : 'Inactivo'} 
                    color={judoka.activo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredJudokas.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </>
  )
}

