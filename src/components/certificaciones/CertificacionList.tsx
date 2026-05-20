import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Button,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
  Switch
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table'
import { Certificacion } from '@/models/certificacion'
import { certificacionController } from '@/controllers/certificacionController'
import { formatters } from '@/utils/formatters'
import Pagination from '@/components/common/Pagination'

interface CertificacionListProps {
  usuarioId: string
  tipoAfiliado: 'sensei' | 'arbitro'
  onEdit?: (certificacion: Certificacion) => void
  onDelete?: (certificacion: Certificacion) => void
  onAdd?: () => void
  refreshTrigger?: number
  readOnly?: boolean
}

export default function CertificacionList({
  usuarioId,
  tipoAfiliado,
  onEdit,
  onDelete,
  onAdd,
  refreshTrigger,
  readOnly = false,
}: CertificacionListProps) {
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha_emision', desc: true }])

  const loadCertificaciones = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await certificacionController.getCertificacionesByUsuario(usuarioId, tipoAfiliado)

    if (response.success && response.data) {
      setCertificaciones(response.data)
    } else {
      setError(response.error || 'Error al cargar las certificaciones')
    }

    setLoading(false)
  }, [usuarioId, tipoAfiliado])

  useEffect(() => {
    if (usuarioId) {
      loadCertificaciones()
    }
  }, [usuarioId, loadCertificaciones, refreshTrigger])

  const getFileIcon = (url: string | null) => {
    if (!url) return null
    if (url.toLowerCase().endsWith('.pdf')) {
      return <PictureAsPdfIcon fontSize="small" color="error" />
    }
    return <ImageIcon fontSize="small" color="primary" />
  }

  const columnHelper = createColumnHelper<Certificacion>()

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'indice',
      header: 'N',
      cell: (info) => info.row.index + 1,
    }),
    columnHelper.accessor('nombre_certificacion', {
      header: 'Nombre',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('descripcion', {
      header: 'Descripción',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('fecha_emision', {
      header: 'Fecha Emisión',
      cell: (info) => formatters.formatDate(info.getValue()),
    }),
    columnHelper.accessor('fecha_vencimiento', {
      header: 'Fecha Vencimiento',
      cell: (info) => formatters.formatDate(info.getValue()),
    }),
    columnHelper.accessor('archivo_url', {
      header: 'Archivo',
      cell: (info) => {
        const url = info.getValue()
        if (!url) return '-'
        return (
          <Box display="flex" alignItems="center" gap={1}>
            {getFileIcon(url)}
            <Button
              size="small"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textTransform: 'none', minWidth: 'auto' }}
            >
              Ver
            </Button>
          </Box>
        )
      },
    }),
    ...(!readOnly ? [columnHelper.accessor('activo', {
      header: 'Estado',
      cell: (info) => {
        const isActive = info.getValue()
        const id = info.row.original.id
        
        const handleToggle = async () => {
          setCertificaciones(prev => prev.map(c => c.id === id ? { ...c, activo: !isActive } : c))

          try {
            const response = await certificacionController.updateCertificacion(id, { activo: !isActive })
            if (!response.success) {
              setCertificaciones(prev => prev.map(c => c.id === id ? { ...c, activo: isActive } : c))
              alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
            }
          } catch (err) {
            setCertificaciones(prev => prev.map(c => c.id === id ? { ...c, activo: isActive } : c))
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
                '& .MuiSwitch-switchBase.Mui-disabled': {
                  color: (isActive ? '#4caf50' : '#f44336') + ' !important',
                  opacity: '1 !important'
                },
                '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                  backgroundColor: (isActive ? '#4caf50' : '#f44336') + ' !important',
                  opacity: '0.5 !important'
                }
              }}
              inputProps={{ 'aria-label': isActive ? 'Desactivar certificación' : 'Activar certificación' }}
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
    })] : []),
  ], [onEdit, onDelete, readOnly])

  const table = useReactTable({
    data: certificaciones,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
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
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Buscar certificación..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          sx={{ flexGrow: 1, backgroundColor: 'white' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: globalFilter ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setGlobalFilter('')} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        {onAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Nueva
          </Button>
        )}
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{ fontWeight: 'bold' }}
                  >
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
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover': { backgroundColor: '#f9f9f9' },
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No se encontraron certificaciones
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {table.getPageCount() > 1 && (
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            totalItems={table.getPrePaginationRowModel().rows.length}
            itemsPerPage={table.getState().pagination.pageSize}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </Box>
      )}
    </Box>
  )
}

