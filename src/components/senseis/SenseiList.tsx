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
  Tooltip,
  Switch
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
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import Pagination from '@/components/common/Pagination'
import { ESPECIALIDADES_SENSEI } from '@/utils/constants'

interface SenseiListProps {
  onEdit?: (sensei: Sensei) => void
  onDelete?: (sensei: Sensei) => void
  refreshTrigger?: number
  clubId?: string
  searchTerm?: string
  itemsPerPage?: number
}

export default function SenseiList({ 
  onEdit, 
  onDelete, 
  refreshTrigger, 
  clubId,
  searchTerm: externalSearchTerm = '', 
  itemsPerPage: initialItemsPerPage = 10 
}: SenseiListProps) {
  const [senseis, setSenseis] = useState<Sensei[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [globalFilter, setGlobalFilter] = useState(externalSearchTerm)
  const [especialidadFilter, setEspecialidadFilter] = useState<string>('all')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')

  // Estado para mantener los IDs que han sido modificados en la sesión actual
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set())

  const loadSenseis = async () => {
    setLoading(true)
    setError(null)
    const response = clubId 
      ? await senseiController.getSenseisByClub(clubId)
      : await senseiController.getAllSenseis(true)
      
    if (response.success && response.data) {
      setSenseis(response.data)
      setModifiedIds(new Set())
    } else {
      setError(response.error || 'Error al cargar los senseis')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSenseis()
  }, [refreshTrigger, clubId])

  useEffect(() => {
    setGlobalFilter(externalSearchTerm)
    setModifiedIds(new Set())
  }, [externalSearchTerm])

  // Definición de columnas con TanStack Table
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
    columnHelper.accessor('activo', {
      header: 'Estado',
      cell: (info) => {
        const isActive = info.getValue()
        const id = info.row.original.id
        
        const handleToggle = async () => {
          setModifiedIds(prev => new Set(prev).add(id))
          setSenseis(prev => prev.map(s => s.id === id ? { ...s, activo: !isActive } : s))
          
          try {
            const response = await senseiController.updateSensei(id, { activo: !isActive })
            if (!response.success) {
              setSenseis(prev => prev.map(s => s.id === id ? { ...s, activo: isActive } : s))
              setModifiedIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
              })
              alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
            }
          } catch (err) {
            setSenseis(prev => prev.map(s => s.id === id ? { ...s, activo: isActive } : s))
            setModifiedIds(prev => {
              const next = new Set(prev)
              next.delete(id)
              return next
            })
            console.error(err)
            alert('Error inesperado al cambiar el estado')
          }
        }

        return (
          <Tooltip title={isActive ? 'Desactivar' : 'Activar'}>
            <Switch 
              checked={!!isActive} 
              onChange={handleToggle}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4caf50',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#4caf50',
                  opacity: 0.5,
                },
                '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                  color: '#f44336',
                },
                '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                  backgroundColor: '#f44336',
                  opacity: 0.5,
                },
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

  // Filtrado y ordenamiento personalizado
  const filteredData = useMemo(() => {
    const filtered = senseis.filter(s => {
      const matchEspecialidad = especialidadFilter === 'all' || s.especialidad === especialidadFilter
      const matchEstado = estadoFilter === 'all' || 
        (estadoFilter === 'activo' ? s.activo : !s.activo)
      
      const search = globalFilter.toLowerCase()
      const matchSearch = !search || 
        s.nombres?.toLowerCase().includes(search) ||
        s.apellidos?.toLowerCase().includes(search) ||
        s.ci?.toLowerCase().includes(search) ||
        s.grado_dan?.toLowerCase().includes(search) ||
        s.especialidad?.toLowerCase().includes(search)

      return matchEspecialidad && matchEstado && matchSearch
    })

    return [...filtered].sort((a, b) => {
      const isAModified = modifiedIds.has(a.id)
      const isBModified = modifiedIds.has(b.id)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo

      if (effectiveAActive === effectiveBActive) return 0
      return effectiveAActive ? -1 : 1
    })
  }, [senseis, especialidadFilter, estadoFilter, globalFilter, modifiedIds])

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
    setEspecialidadFilter('all')
    setEstadoFilter('all')
    setGlobalFilter('')
    setModifiedIds(new Set())
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
            placeholder="Buscar por carnet, nombre, especialidad..."
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
            <InputLabel>Especialidad</InputLabel>
            <Select
              value={especialidadFilter}
              label="Especialidad"
              onChange={(e) => setEspecialidadFilter(e.target.value)}
            >
              <MenuItem value="all">Todas las especialidades</MenuItem>
              {ESPECIALIDADES_SENSEI.map(esp => (
                <MenuItem key={esp} value={esp}>{esp}</MenuItem>
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

          {(especialidadFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
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
