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
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef
} from '@tanstack/react-table'
import { MiembroAsociacion } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import Pagination from '@/components/common/Pagination'
import { formatters } from '@/utils/formatters'
import { CARGOS_ASOCIACION } from '@/utils/constants'

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
  searchTerm: externalSearchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10 
}: MiembroAsociacionListProps) {
  const [miembros, setMiembros] = useState<MiembroAsociacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [globalFilter, setGlobalFilter] = useState(externalSearchTerm)
  const [cargoFilter, setCargoFilter] = useState<string>('all')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')

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

  useEffect(() => {
    setGlobalFilter(externalSearchTerm)
  }, [externalSearchTerm])

  // Definición de columnas con TanStack Table
  const columnHelper = createColumnHelper<MiembroAsociacion>()
  
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
    columnHelper.accessor('cargo', {
      header: 'Cargo',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('fecha_ingreso', {
      header: 'Fecha Ingreso',
      cell: (info) => info.getValue() ? formatters.formatDate(info.getValue()!) : '-',
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
    return miembros.filter(m => {
      const matchCargo = cargoFilter === 'all' || m.cargo === cargoFilter
      const matchEstado = estadoFilter === 'all' || 
        (estadoFilter === 'activo' ? m.activo : !m.activo)
      
      const search = globalFilter.toLowerCase()
      const matchSearch = !search || 
        m.nombres?.toLowerCase().includes(search) ||
        m.apellidos?.toLowerCase().includes(search) ||
        m.ci?.toLowerCase().includes(search) ||
        m.cargo?.toLowerCase().includes(search)

      return matchCargo && matchEstado && matchSearch
    })
  }, [miembros, cargoFilter, estadoFilter, globalFilter])

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
    setCargoFilter('all')
    setEstadoFilter('all')
    setGlobalFilter('')
  }

  if (loading) {
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
            placeholder="Buscar por carnet, nombre..."
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
            <InputLabel>Cargo</InputLabel>
            <Select
              value={cargoFilter}
              label="Cargo"
              onChange={(e) => setCargoFilter(e.target.value)}
            >
              <MenuItem value="all">Todos los cargos</MenuItem>
              {CARGOS_ASOCIACION.map(cargo => (
                <MenuItem key={cargo} value={cargo}>{cargo}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'white' }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={estadoFilter}
              label="Estado"
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <MenuItem value="all">Todos los estados</MenuItem>
              <MenuItem value="activo">Activos</MenuItem>
              <MenuItem value="inactivo">Inactivos</MenuItem>
            </Select>
          </FormControl>

          {(cargoFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
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
            No se encontraron resultados con los filtros aplicados
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
