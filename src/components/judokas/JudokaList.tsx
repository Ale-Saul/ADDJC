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
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import Pagination from '@/components/common/Pagination'
import { BELT_COLORS, CATEGORIES } from '@/utils/constants'

interface JudokaListProps {
  judokas?: Judoka[]
  isLoading?: boolean
  onEdit?: (judoka: Judoka) => void
  onDelete?: (judoka: Judoka) => void
  refreshTrigger?: number
  clubId?: string
  entrenadorId?: string
  searchTerm?: string
  itemsPerPage?: number
}

export default function JudokaList({ 
  judokas: judokasProp, 
  isLoading: isLoadingProp, 
  onEdit, 
  onDelete, 
  refreshTrigger, 
  clubId, 
  entrenadorId, 
  searchTerm: externalSearchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10 
}: JudokaListProps) {
  const [judokasLocal, setJudokasLocal] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [globalFilter, setGlobalFilter] = useState(externalSearchTerm)
  const [cinturonFilter, setCinturonFilter] = useState<string>('all')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')

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
    if (!judokasProp) {
      loadJudokas()
    }
  }, [refreshTrigger, clubId, entrenadorId, judokasProp])

  useEffect(() => {
    setGlobalFilter(externalSearchTerm)
  }, [externalSearchTerm])

  const judokas = judokasProp || judokasLocal
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
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('activo', {
      header: 'Estado',
      cell: (info) => (
        <Chip 
          label={info.getValue() ? 'Activo' : 'Inactivo'} 
          color={info.getValue() ? 'success' : 'default'}
          size="small"
        />
      ),
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
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => onDelete(info.row.original)}
              title="Eliminar"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    }),
  ], [onEdit, onDelete])

  // Filtrado personalizado
  const filteredData = useMemo(() => {
    return judokas.filter(j => {
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
  }, [judokas, cinturonFilter, categoriaFilter, estadoFilter, globalFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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

          {(cinturonFilter !== 'all' || categoriaFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
            <Tooltip title="Limpiar filtros">
              <IconButton onClick={clearFilters} color="warning" size="small">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
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
    </Box>
  )
}
