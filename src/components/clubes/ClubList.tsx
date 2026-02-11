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
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import Pagination from '@/components/common/Pagination'
import { MUNICIPIOS } from '@/utils/constants'

interface ClubListProps {
  onEdit?: (club: Club) => void
  onDelete?: (club: Club) => void
  refreshTrigger?: number
  searchTerm?: string
  itemsPerPage?: number
}

export default function ClubList({ 
  onEdit, 
  onDelete, 
  refreshTrigger, 
  searchTerm: externalSearchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10 
}: ClubListProps) {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [globalFilter, setGlobalFilter] = useState(externalSearchTerm)
  const [municipioFilter, setMunicipioFilter] = useState<string>('all')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')

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

  useEffect(() => {
    setGlobalFilter(externalSearchTerm)
  }, [externalSearchTerm])

  // Definición de columnas con TanStack Table
  const columnHelper = createColumnHelper<Club>()
  
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'indice',
      header: 'N°',
      cell: (info) => info.row.index + 1,
    }),
    columnHelper.accessor('nombre_club', {
      header: 'Nombre del Club',
    }),
    columnHelper.accessor('provincia', {
      header: 'Municipio',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('telefono_contacto', {
      header: 'Teléfono',
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
    return clubes.filter(c => {
      const matchMunicipio = municipioFilter === 'all' || c.provincia === municipioFilter
      const matchEstado = estadoFilter === 'all' || 
        (estadoFilter === 'activo' ? c.activo : !c.activo)
      
      const search = globalFilter.toLowerCase()
      const matchSearch = !search || 
        c.nombre_club?.toLowerCase().includes(search) ||
        c.provincia?.toLowerCase().includes(search) ||
        c.direccion?.toLowerCase().includes(search) ||
        c.telefono_contacto?.toLowerCase().includes(search)

      return matchMunicipio && matchEstado && matchSearch
    })
  }, [clubes, municipioFilter, estadoFilter, globalFilter])

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
    setMunicipioFilter('all')
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
            placeholder="Buscar por nombre, municipio, dirección..."
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
          
          <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
            <InputLabel>Municipio</InputLabel>
            <Select
              value={municipioFilter}
              label="Municipio"
              onChange={(e) => setMunicipioFilter(e.target.value)}
            >
              <MenuItem value="all">Todos los municipios</MenuItem>
              {MUNICIPIOS.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
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

          {(municipioFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
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
            No se encontraron clubes con los filtros aplicados
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
