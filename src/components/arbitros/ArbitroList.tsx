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
  Tooltip,
  Switch
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArticleIcon from '@mui/icons-material/Article'
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
import { Arbitro } from '@/models/arbitro'
import Pagination from '@/components/common/Pagination'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { arbitroController } from '@/controllers/arbitroController'
import { useArbitroList } from '@/hooks/useArbitroList'

interface ArbitroListProps {
  onEdit?: (arbitro: Arbitro) => void
  onDelete?: (arbitro: Arbitro) => void
  onCertificacion?: (arbitro: Arbitro) => void
  refreshTrigger?: number
  searchTerm?: string
  itemsPerPage?: number
}

export default function ArbitroList({ 
  onEdit, 
  onDelete,
  onCertificacion,
  refreshTrigger, 
  searchTerm: externalSearchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10 
}: ArbitroListProps) {
  const { state, dispatch, loadArbitros, toggleStatus, updateLocalArbitro, deleteLocalArbitro, filteredData } = useArbitroList(externalSearchTerm)
  const { loading, error, globalFilter, nivelFilter, estadoFilter, showFilters, modifiedIds } = state
  const [pendingDelete, setPendingDelete] = useState<Arbitro | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleEdit = (arbitro: Arbitro) => {
    if (onEdit) {
      onEdit(arbitro)
    }
  }

  const handleDelete = (arbitro: Arbitro) => {
    if (onDelete) {
      onDelete(arbitro)
    } else {
      setPendingDelete(arbitro)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmLoading(true)
    try {
      const response = await arbitroController.deleteArbitro(pendingDelete.id)
      if (response.success) {
        deleteLocalArbitro(pendingDelete.id)
      }
    } finally {
      setConfirmLoading(false)
      setPendingDelete(null)
    }
  }

  useEffect(() => {
    loadArbitros()
  }, [loadArbitros, refreshTrigger])

  useEffect(() => {
    dispatch({ type: 'SET_GLOBAL_FILTER', payload: externalSearchTerm })
  }, [externalSearchTerm, dispatch])

  const columnHelper = createColumnHelper<Arbitro>()
  
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
    columnHelper.accessor('nivel_arbitraje', {
      header: 'Nivel',
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
          {onCertificacion && (
            <IconButton size="small" color="success" onClick={() => onCertificacion(info.row.original)} title="Certificación" aria-label="Gestionar certificación">
              <ArticleIcon fontSize="small" />
            </IconButton>
          )}
          {onEdit && (
            <IconButton size="small" color="primary" onClick={() => handleEdit(info.row.original)} title="Editar" aria-label="Editar árbitro">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" color="error" onClick={() => handleDelete(info.row.original)} title="Eliminar" aria-label="Eliminar árbitro">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    }),
  ], [onEdit, onDelete, onCertificacion, toggleStatus])

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
              placeholder="Buscar por carnet, nombre..."
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
            
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                height: '40px'
              }}
              onClick={() => dispatch({ type: 'TOGGLE_SHOW_FILTERS' })}
            >
              <FilterListIcon fontSize="small" />
              Filtros
              {showFilters ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </button>

            {(nivelFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
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
                <InputLabel>Nivel</InputLabel>
                <Select value={nivelFilter} label="Nivel" onChange={(e) => dispatch({ type: 'SET_NIVEL_FILTER', payload: e.target.value })}>
                  <MenuItem value="all">Todos los niveles</MenuItem>
                  <MenuItem value="Regional">Regional</MenuItem>
                  <MenuItem value="Nacional">Nacional</MenuItem>
                  <MenuItem value="Internacional">Internacional</MenuItem>
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
            No se encontraron árbitros con los filtros aplicados
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
        title="Eliminar Árbitro"
        message={pendingDelete ? `¿Estás seguro de eliminar al árbitro "${pendingDelete.nombres} ${pendingDelete.apellidos}"?` : ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
        confirmText="Eliminar"
        loading={confirmLoading}
      />
    </Box>
  )
}
