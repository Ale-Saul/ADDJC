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
  flexRender,
  createColumnHelper
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
  const [searchTerm, setSearchTerm] = useState('')
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set())

  const loadCertificaciones = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await certificacionController.getCertificacionesByUsuario(usuarioId, tipoAfiliado)

    if (response.success && response.data) {
      setCertificaciones(response.data)
      setModifiedIds(new Set())
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

  // Filtrado y ordenamiento de datos
  const filteredData = useMemo(() => {
    const search = searchTerm.toLowerCase()
    const filtered = certificaciones.filter(c => 
      c.nombre_certificacion.toLowerCase().includes(search) ||
      (c.descripcion?.toLowerCase() || '').includes(search)
    )

    return [...filtered].sort((a, b) => {
      const isAModified = modifiedIds.has(a.id)
      const isBModified = modifiedIds.has(b.id)
      
      // Si fue modificado en esta sesión, usamos el estado inverso para el ordenamiento
      // (así se mantiene en su posición actual hasta que se recargue la página)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo

      if (effectiveAActive === effectiveBActive) {
        // Ordenar por fecha de emisión si tienen el mismo estado
        return new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime()
      }
      return effectiveAActive ? -1 : 1
    })
  }, [certificaciones, searchTerm, modifiedIds])

  const columnHelper = createColumnHelper<Certificacion>()

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'indice',
      header: 'N°',
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
          // Optimistic update
          setModifiedIds(prev => new Set(prev).add(id))
          setCertificaciones(prev => prev.map(c => c.id === id ? { ...c, activo: !isActive } : c))

          try {
            const response = await certificacionController.updateCertificacion(id, { activo: !isActive })
            if (!response.success) {
              // Revert on error
              setCertificaciones(prev => prev.map(c => c.id === id ? { ...c, activo: isActive } : c))
              setModifiedIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
              })
              alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
            }
          } catch (err) {
            // Revert on error
            setCertificaciones(prev => prev.map(c => c.id === id ? { ...c, activo: isActive } : c))
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
              size="small"
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
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, backgroundColor: 'white' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {onAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ height: 40, textTransform: 'none' }}
          >
            Agregar
          </Button>
        )}
      </Stack>

      {filteredData.length === 0 ? (
        <Box textAlign="center" py={4} component={Paper} variant="outlined">
          <Typography variant="body1" color="text.secondary">
            No se encontraron certificaciones
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
                        {flexRender(header.column.columnDef.header, header.getContext())}
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

