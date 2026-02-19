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
  const [showFilters, setShowFilters] = useState(false)

  // Estado para mantener los IDs que han sido modificados en la sesión actual
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set())

  const loadClubes = async () => {
    setLoading(true)
    setError(null)
    const response = await clubController.getAllClubes(true)
    if (response.success && response.data) {
      setClubes(response.data)
      setModifiedIds(new Set())
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
    setModifiedIds(new Set())
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
      cell: (info) => {
        const isActive = info.getValue()
        const id = info.row.original.id
        
        const handleToggle = async () => {
          setModifiedIds(prev => new Set(prev).add(id))
          setClubes(prev => prev.map(c => c.id === id ? { ...c, activo: !isActive } : c))
          
          try {
            const response = await clubController.updateClub(id, { activo: !isActive })
            if (!response.success) {
              setClubes(prev => prev.map(c => c.id === id ? { ...c, activo: isActive } : c))
              setModifiedIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
              })
              alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
            }
          } catch (err) {
            setClubes(prev => prev.map(c => c.id === id ? { ...c, activo: isActive } : c))
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
    const filtered = clubes.filter(c => {
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

    return [...filtered].sort((a, b) => {
      const isAModified = modifiedIds.has(a.id)
      const isBModified = modifiedIds.has(b.id)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo

      if (effectiveAActive === effectiveBActive) return 0
      return effectiveAActive ? -1 : 1
    })
  }, [clubes, municipioFilter, estadoFilter, globalFilter, modifiedIds])

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
    setMunicipioFilter('all')
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
        <Stack spacing={2}>
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

            {(municipioFilter !== 'all' || estadoFilter !== 'all' || globalFilter !== '') && (
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
              <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
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

              <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white' }}>
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
