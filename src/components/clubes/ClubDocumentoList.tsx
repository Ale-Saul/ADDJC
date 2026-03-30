import { useState, useEffect, useCallback, useMemo } from 'react'
import {
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
  Button,
  TextField,
  InputAdornment,
  Stack,
  Tooltip
} from '@mui/material'
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
import { ClubDocumento } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import Pagination from '@/components/common/Pagination'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

interface ClubDocumentoListProps {
  clubId: string
  onDelete?: (documento: ClubDocumento) => void
  onAdd?: () => void
  refreshTrigger?: number
  readOnly?: boolean
}

export default function ClubDocumentoList({
  clubId,
  onDelete,
  onAdd,
  refreshTrigger,
  readOnly = false,
}: ClubDocumentoListProps) {
  const { user } = useAuth()
  const isEncargado = user?.rol === ROL.ENCARGADO
  const [documentos, setDocumentos] = useState<ClubDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre_documento', desc: false }])

  const loadDocumentos = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await clubController.getClubById(clubId)

    if (response.success && response.data) {
      setDocumentos(response.data.documentos || [])
    } else {
      setError(response.error || 'Error al cargar los documentos')
    }

    setLoading(false)
  }, [clubId])

  useEffect(() => {
    if (clubId) {
      loadDocumentos()
    }
  }, [clubId, loadDocumentos, refreshTrigger])

  const getFileIcon = (url: string | null) => {
    if (!url) return null
    if (url.toLowerCase().endsWith('.pdf')) {
      return <PictureAsPdfIcon fontSize="small" color="error" />
    }
    return <ImageIcon fontSize="small" color="primary" />
  }

  const columnHelper = createColumnHelper<ClubDocumento>()

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'indice',
      header: 'N°',
      cell: (info) => info.row.index + 1,
    }),
    columnHelper.accessor('nombre_documento', {
      header: 'Nombre',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('tipo_documento', {
      header: 'Tipo',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('url_documento', {
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
    ...(!readOnly ? [
      columnHelper.display({
        id: 'acciones',
        header: () => <Box textAlign="right">Acciones</Box>,
        cell: (info) => (
          <Box textAlign="right">
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
      })
    ] : []),
  ], [onDelete, readOnly])

  const table = useReactTable({
    data: documentos,
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
          placeholder="Buscar documento..."
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
        {onAdd && !isEncargado && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Nuevo
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
                    No se encontraron documentos
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
