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
import { Club } from '@/models/club'
import Pagination from '@/components/common/Pagination'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { clubController } from '@/controllers/clubController'
import { MUNICIPIOS } from '@/utils/constants'
import { useClubList } from '@/hooks/useClubList'

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
  const { state, dispatch, loadClubes, toggleStatus, updateLocalClub, deleteLocalClub, filteredData } = useClubList(externalSearchTerm)
  const { loading, error, globalFilter, municipioFilter, estadoFilter, showFilters, modifiedIds } = state
  const [pendingDelete, setPendingDelete] = useState<Club | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleEdit = (club: Club) => {
    if (onEdit) {
      onEdit(club)
    }
  }

  const handleDelete = (club: Club) => {
    if (onDelete) {
      onDelete(club)
    } else {
      setPendingDelete(club)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmLoading(true)
    try {
      const response = await clubController.deleteClub(pendingDelete.id)
      if (response.success) {
        deleteLocalClub(pendingDelete.id)
      }
    } finally {
      setConfirmLoading(false)
      setPendingDelete(null)
    }
  }

  useEffect(() => {
    loadClubes()
  }, [loadClubes, refreshTrigger])

  useEffect(() => {
    dispatch({ type: 'SET_GLOBAL_FILTER', payload: externalSearchTerm })
  }, [externalSearchTerm, dispatch])

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
      cell: (info) => {
        const isActive = info.getValue()
        const id = info.row.original.id
        return (
          <Tooltip title={isActive ? 'Desactivar' : 'Activar'}>
            <Switch 
              checked={!!isActive} 
              onChange={() => toggleStatus(id, !!isActive)}
              size="medium"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4caf50' },
                '& .MuiSwitch-switchBase': { color: '#f44336' },
                '& .MuiSwitch-switchBase + .MuiSwitch-track': { backgroundColor: '#f44336' },
              }}
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
            <IconButton size="small" color="primary" onClick={() => handleEdit(info.row.original)} title="Editar" aria-label="Editar club">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" color="error" onClick={() => handleDelete(info.row.original)} title="Eliminar" aria-label="Eliminar club">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    }),
  ], [onEdit, onDelete, toggleStatus])

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por nombre, municipio..."
              value={globalFilter}
              onChange={(e) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: e.target.value })}
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
              onClick={() => dispatch({ type: 'TOGGLE_SHOW_FILTERS' })}
              color={showFilters ? 'primary' : 'inherit'}
              sx={{ backgroundColor: 'white', height: '40px', textTransform: 'none' }}
            >
              Filtros
            </Button>

            {(municipioFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
              <Tooltip title="Limpiar filtros">
                <IconButton onClick={() => dispatch({ type: 'CLEAR_FILTERS', initialSearch: externalSearchTerm })} color="warning" size="small">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          <Collapse in={showFilters}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ pt: 1 }}>
              <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
                <InputLabel>Municipio</InputLabel>
                <Select value={municipioFilter} label="Municipio" onChange={(e) => dispatch({ type: 'SET_MUNICIPIO_FILTER', payload: e.target.value })}>
                  <MenuItem value="all">Todos los municipios</MenuItem>
                  {MUNICIPIOS.map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
                <InputLabel>Estado</InputLabel>
                <Select value={estadoFilter} label="Estado" onChange={(e) => dispatch({ type: 'SET_ESTADO_FILTER', payload: e.target.value })}>
                  <MenuItem value="all">Todos los estados</MenuItem>
                  <MenuItem value="activo">Activos</MenuItem>
                  <MenuItem value="inactivo">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Collapse>
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
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
        title="Eliminar Club"
        message={pendingDelete ? `¿Estás seguro de eliminar el club "${pendingDelete.nombre_club}"?` : ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
        confirmText="Eliminar"
        loading={confirmLoading}
      />
    </Box>
  )
}
