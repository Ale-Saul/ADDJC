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
import { Sensei } from '@/models/sensei'
import Pagination from '@/components/common/Pagination'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { senseiController } from '@/controllers/senseiController'
import { ESPECIALIDADES_SENSEI } from '@/utils/constants'
import { useSenseiList } from '@/hooks/useSenseiList'

interface SenseiListProps {
  onEdit?: (sensei: Sensei) => void
  onDelete?: (sensei: Sensei) => void
  onCertificacion?: (sensei: Sensei) => void
  refreshTrigger?: number
  clubId?: string
  searchTerm?: string
  itemsPerPage?: number
  showUnassigned?: boolean
  readOnly?: boolean
}

export default function SenseiList({ 
  onEdit, 
  onDelete,
  onCertificacion,
  refreshTrigger, 
  clubId,
  searchTerm: externalSearchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10,
  showUnassigned = false,
  readOnly = false,
}: SenseiListProps) {
  const { state, dispatch, loadSenseis, toggleStatus, updateLocalSensei, deleteLocalSensei, filteredData } = useSenseiList(externalSearchTerm)
  const { loading, error, globalFilter, especialidadFilter, estadoFilter, showFilters, modifiedIds } = state
  const [pendingDelete, setPendingDelete] = useState<Sensei | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleEdit = (sensei: Sensei) => {
    if (onEdit) {
      onEdit(sensei)
    }
  }

  const handleDelete = (sensei: Sensei) => {
    if (onDelete) {
      onDelete(sensei)
    } else {
      setPendingDelete(sensei)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmLoading(true)
    try {
      const response = await senseiController.deleteSensei(pendingDelete.id)
      if (response.success) {
        deleteLocalSensei(pendingDelete.id)
      }
    } finally {
      setConfirmLoading(false)
      setPendingDelete(null)
    }
  }

  useEffect(() => {
    loadSenseis(clubId)
  }, [loadSenseis, refreshTrigger, clubId])

  useEffect(() => {
    dispatch({ type: 'SET_GLOBAL_FILTER', payload: externalSearchTerm })
  }, [externalSearchTerm, dispatch])

  const columnHelper = createColumnHelper<Sensei>()
  
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
          <Typography variant="body2">{info.getValue()}</Typography>
          {showUnassigned && !info.row.original.club_id && (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              Sin club
            </Typography>
          )}
        </Box>
      ),
    }),
    columnHelper.accessor('apellidos', {
      header: 'Apellidos',
    }),
    columnHelper.accessor('grado_dan', {
      header: 'Grado Dan',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('especialidad', {
      header: 'Especialidad',
      cell: (info) => info.getValue() || '-',
    }),
    ...(!readOnly ? [
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
    ] : []),
    columnHelper.display({
      id: 'acciones',
      header: () => <Box textAlign="right">Acciones</Box>,
      cell: (info) => (
        <Box textAlign="right">
          {onCertificacion && (
            <IconButton size="small" color="success" onClick={() => onCertificacion(info.row.original)} title="Certificaciones" aria-label="Ver certificaciones">
              <ArticleIcon fontSize="small" />
            </IconButton>
          )}
          {onEdit && (
            <IconButton size="small" color="primary" onClick={() => handleEdit(info.row.original)} title="Editar" aria-label="Editar sensei">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" color="error" onClick={() => handleDelete(info.row.original)} title="Eliminar" aria-label="Eliminar sensei">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    }),
  ], [onEdit, onDelete, onCertificacion, toggleStatus, readOnly, showUnassigned])

  // Filtrado local por club + unassigned (encima del filteredData del hook)
  const localFilteredData = useMemo(() => {
    const data = filteredData.filter(s => {
      if (clubId) {
        return s.club_id === clubId || (showUnassigned && !s.club_id)
      }
      return true
    })
    return [...data].sort((a, b) => {
      // Senseis sin club van siempre al final
      const aNoClub = !a.club_id ? 1 : 0
      const bNoClub = !b.club_id ? 1 : 0
      if (aNoClub !== bNoClub) return aNoClub - bNoClub
      return 0
    })
  }, [filteredData, clubId, showUnassigned])

  const table = useReactTable({
    data: localFilteredData,
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
              placeholder="Buscar por carnet, nombre, especialidad..."
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

            {(especialidadFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
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
                <InputLabel>Especialidad</InputLabel>
                <Select value={especialidadFilter} label="Especialidad" onChange={(e) => dispatch({ type: 'SET_ESPECIALIDAD_FILTER', payload: e.target.value })}>
                  <MenuItem value="all">Todas las especialidades</MenuItem>
                  {ESPECIALIDADES_SENSEI.map(esp => (
                    <MenuItem key={esp} value={esp}>{esp}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!readOnly && (
                <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={estadoFilter} label="Estado" onChange={(e) => dispatch({ type: 'SET_ESTADO_FILTER', payload: e.target.value })}>
                    <MenuItem value="all">Todos los estados</MenuItem>
                    <MenuItem value="activo">Activos</MenuItem>
                    <MenuItem value="inactivo">Inactivos</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      {localFilteredData.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron senseis con los filtros aplicados
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
        title="Eliminar Sensei"
        message={pendingDelete ? `¿Estás seguro de eliminar al sensei "${pendingDelete.nombres} ${pendingDelete.apellidos}"?` : ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
        confirmText="Eliminar"
        loading={confirmLoading}
      />
    </Box>
  )
}
