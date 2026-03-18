'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  Switch
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { Judoka } from '@/models/judoka'
import Pagination from '@/components/common/Pagination'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { judokaController } from '@/controllers/judokaController'
import { BELT_COLORS, CATEGORIES } from '@/utils/constants'
import { useJudokaList } from '@/hooks/useJudokaList'

interface JudokaListProps {
  judokas?: Judoka[]
  isLoading?: boolean
  onEdit?: (judoka: Judoka) => void
  onDelete?: (judoka: Judoka) => void
  refreshTrigger?: number
  clubId?: string | null
  entrenadorId?: string
  senseiId?: string
  searchTerm?: string
  itemsPerPage?: number
  showUnassigned?: boolean
  readOnly?: boolean
}

const BELT_COLOR_MAP: Record<string, string> = {
  'Blanco': '#FFFFFF',
  'Amarillo': '#FFEB3B',
  'Naranja': '#FF9800',
  'Verde': '#4CAF50',
  'Azul': '#2196F3',
  'Café': '#795548',
  'Negro': '#212121',
}

export default function JudokaList({ 
  judokas: judokasProp, 
  isLoading: isLoadingProp, 
  onEdit, 
  onDelete, 
  refreshTrigger, 
  clubId, 
  entrenadorId,
  senseiId,
  searchTerm: externalSearchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10,
  showUnassigned = false,
  readOnly = false
}: JudokaListProps) {
  const { 
    judokas, 
    loading, 
    error, 
    toggleStatus,
    updateLocalJudoka,
    deleteLocalJudoka,
    modifiedIds
  } = useJudokaList({
    clubId: clubId || undefined,
    entrenadorId,
    refreshTrigger,
    judokasProp
  })

  const handleDelete = (judoka: Judoka) => {
    if (onDelete) {
      onDelete(judoka)
    } else {
      setPendingDelete(judoka)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmLoading(true)
    try {
      const response = await judokaController.deleteJudoka(pendingDelete.id)
      if (response.success) {
        deleteLocalJudoka(pendingDelete.id)
      }
    } finally {
      setConfirmLoading(false)
      setPendingDelete(null)
    }
  }
  
  const [globalFilter, setGlobalFilter] = useState(externalSearchTerm)
  const [cinturonFilter, setCinturonFilter] = useState<string>('all')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Judoka | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    setGlobalFilter(externalSearchTerm)
  }, [externalSearchTerm])

  const isLoading = isLoadingProp !== undefined ? isLoadingProp : loading

  // Definición de columnas con TanStack Table
  const columnHelper = createColumnHelper<Judoka>()
  
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'indice',
      header: 'N°',
      cell: (info) => info.row.index + 1,
    }),
    columnHelper.accessor('ci', {
      header: 'Carnet',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('nombres', {
      header: 'Nombres',
      cell: (info) => (
        <Box>
          <Box>{info.getValue()}</Box>
          {showUnassigned && !info.row.original.club_id && (
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
              Sin club
            </Box>
          )}
        </Box>
      ),
    }),
    columnHelper.accessor('apellidos', {
      header: 'Apellidos',
    }),
    columnHelper.accessor('categoria', {
      header: 'Categoría',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('cinturon_actual', {
      header: 'Cinturón',
      cell: (info) => {
        const belt = info.getValue()
        if (!belt) return '-'

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: BELT_COLOR_MAP[belt] || '#ccc',
                border: belt === 'Blanco' ? '1px solid #ddd' : 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            />
            {belt}
          </Box>
        )
      },
    }),
    // Estado y Acciones solo para roles con permisos de gestión
    ...(!readOnly ? [columnHelper.accessor('activo', {
      header: 'Estado',
      cell: (info) => {
        const isActive = info.getValue()
        const id = info.row.original.id
        
        const handleToggle = () => toggleStatus(id, !!isActive)

        return (
          <Tooltip title={isActive ? 'Desactivar' : 'Activar'}>
            <Switch 
              checked={!!isActive} 
              onChange={handleToggle}
              size="medium"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4caf50',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  },
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#4caf50',
                },
                '& .MuiSwitch-switchBase': {
                  color: '#f44336',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  },
                },
                '& .MuiSwitch-switchBase + .MuiSwitch-track': {
                  backgroundColor: '#f44336',
                },
              }}
              inputProps={{ 'aria-label': isActive ? 'Desactivar judoka' : 'Activar judoka' }}
            />
          </Tooltip>
        )
      },
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <Box textAlign="right">Acciones</Box>,
      cell: (info) => (
        <Box textAlign="right">
          {onEdit && (
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => onEdit(info.row.original)}
              title="Editar"
              aria-label="Editar judoka"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => handleDelete(info.row.original)}
              title="Eliminar"
              aria-label="Eliminar judoka"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    })] : []),
  ], [onEdit, onDelete, toggleStatus, readOnly])

  // Filtrado y ordenamiento personalizado
  const filteredData = useMemo(() => {
    const filtered = judokas.filter(j => {
      let matchesClub: boolean
      if (senseiId && clubId) {
        // Vista SENSEI: sus propios judokas + los del club sin sensei + sin club
        if (!j.club_id) {
          matchesClub = showUnassigned
        } else if (j.club_id === clubId) {
          matchesClub = !j.entrenador_id || j.entrenador_id === senseiId
        } else {
          matchesClub = false
        }
      } else if (readOnly && !clubId) {
        // Judoka sin club: mostrar solo los que tampoco tienen club
        matchesClub = !j.club_id
      } else {
        // Si showUnassigned es true, mostramos los del clubId O los que no tienen club
        matchesClub = clubId ? (j.club_id === clubId || (showUnassigned && !j.club_id)) : true
      }
      const matchesEntrenador = entrenadorId ? j.entrenador_id === entrenadorId : true
      
      if (!matchesClub || !matchesEntrenador) return false

      const matchCinturon = cinturonFilter === 'all' || j.cinturon_actual === cinturonFilter
      const matchCategoria = categoriaFilter === 'all' || j.categoria === categoriaFilter
      const matchEstado = estadoFilter === 'all' || 
        (estadoFilter === 'activo' ? j.activo : !j.activo)
      
      const search = globalFilter.toLowerCase()
      const matchSearch = !search || 
        j.nombres?.toLowerCase().includes(search) ||
        j.apellidos?.toLowerCase().includes(search) ||
        j.ci?.toLowerCase().includes(search) ||
        j.categoria?.toLowerCase().includes(search) ||
        j.cinturon_actual?.toLowerCase().includes(search)

      return matchCinturon && matchCategoria && matchEstado && matchSearch
    })

    return [...filtered].sort((a, b) => {
      // Judokas sin club van siempre al final
      const aNoClub = !a.club_id ? 1 : 0
      const bNoClub = !b.club_id ? 1 : 0
      if (aNoClub !== bNoClub) return aNoClub - bNoClub

      const isAModified = modifiedIds.has(a.id)
      const isBModified = modifiedIds.has(b.id)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo

      if (effectiveAActive === effectiveBActive) return 0
      return effectiveAActive ? -1 : 1
    })
  }, [judokas, cinturonFilter, categoriaFilter, estadoFilter, globalFilter, modifiedIds, senseiId, clubId, showUnassigned, entrenadorId, readOnly])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: initialItemsPerPage,
      },
    },
  })

  const clearFilters = () => {
    setCinturonFilter('all')
    setCategoriaFilter('all')
    setEstadoFilter('all')
    setGlobalFilter('')
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
    )
  }

  return (
    <Box>
      {/* Barra de Filtros */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por carnet, nombre, categoría..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              sx={{ flexGrow: 1, backgroundColor: 'white' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'inherit'}
              sx={{ 
                backgroundColor: 'white',
                height: '40px',
                textTransform: 'none',
                borderColor: showFilters ? 'primary.main' : 'rgba(0, 0, 0, 0.23)'
              }}
            >
              Filtros
            </Button>

            {(cinturonFilter !== 'all' || categoriaFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
              <Tooltip title="Limpiar filtros">
                <IconButton onClick={clearFilters} color="warning" size="small">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          <Collapse in={showFilters}>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2} 
              alignItems="center"
              sx={{ pt: 1 }}
            >
              <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'white' }}>
                <InputLabel>Cinturón</InputLabel>
                <Select
                  value={cinturonFilter}
                  label="Cinturón"
                  onChange={(e) => setCinturonFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {BELT_COLORS.map(belt => (
                    <MenuItem key={belt} value={belt}>{belt}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'white' }}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoriaFilter}
                  label="Categoría"
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!readOnly && (
              <FormControl size="small" sx={{ minWidth: 130, backgroundColor: 'white' }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFilter}
                  label="Estado"
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="activo">Activos</MenuItem>
                  <MenuItem value="inactivo">Inactivos</MenuItem>
                </Select>
              </FormControl>
              )}
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      {filteredData.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron judokas con los filtros aplicados
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableCell key={header.id} sx={{ fontWeight: 'bold', py: 1.5 }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} hover>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} sx={{ py: 1 }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            totalItems={filteredData.length}
            itemsPerPage={table.getState().pagination.pageSize}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            onItemsPerPageChange={(size) => table.setPageSize(size)}
          />
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Eliminar Judoka"
        message={pendingDelete ? `¿Estás seguro de eliminar al judoka "${pendingDelete.nombres} ${pendingDelete.apellidos}"?` : ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
        confirmText="Eliminar"
        loading={confirmLoading}
      />
    </Box>
  )
}
