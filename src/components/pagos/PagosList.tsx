'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PaymentIcon from '@mui/icons-material/Payment'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { Pago } from '@/models/pago'
import RegistrarPagoForm from './RegistrarPagoForm'
import EditarPagoForm from './EditarPagoForm'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { formatters } from '@/utils/formatters'
import { ESTADO_PAGO, TIPO_PAGO_LABELS } from '@/constants/pagos'
import { usePagosList } from '@/hooks/usePagosList'
import Pagination from '@/components/common/Pagination'

interface PagosListProps {
  judokaId: string
  judokaNombre: string
  onPagoDeleted?: () => void
}

export default function PagosList({ judokaId, judokaNombre, onPagoDeleted }: PagosListProps) {
  const {
    pagos, loading, deleting, fetchError, deleteError,
    pagoToDelete, fetchPagos, requestDelete, confirmDelete, cancelDelete, clearDeleteError,
  } = usePagosList(judokaId, onPagoDeleted)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPagos, setSelectedPagos] = useState<string[]>([])
  const [openRegistrarDialog, setOpenRegistrarDialog] = useState(false)
  const [openEditarDialog, setOpenEditarDialog] = useState(false)
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null)

  // Filtrado de datos
  const filteredData = useMemo(() => {
    const search = searchTerm.toLowerCase()
    return pagos.filter(p =>
      p.concepto.toLowerCase().includes(search) ||
      (p.descripcion?.toLowerCase() || '').includes(search)
    )
  }, [pagos, searchTerm])

  const columnHelper = createColumnHelper<Pago>()

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          size="small"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
          size="small"
        />
      ),
    }),
    columnHelper.accessor('concepto', {
      header: 'Concepto',
      cell: (info) => (
        <Box>
          <Typography variant="body2">{info.getValue()}</Typography>
          {info.row.original.descripcion && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {info.row.original.descripcion}
            </Typography>
          )}
        </Box>
      ),
    }),
    columnHelper.accessor('tipo_pago', {
      header: 'Tipo',
      cell: (info) => (
        <Typography variant="caption">
          {TIPO_PAGO_LABELS[info.getValue() as keyof typeof TIPO_PAGO_LABELS] || info.getValue()}
        </Typography>
      ),
    }),
    columnHelper.accessor('monto_final', {
      header: 'Monto',
      cell: (info) => (
        <Box textAlign="right">
          <Typography variant="body2" fontWeight="bold">
            Bs. {info.getValue().toFixed(2)}
          </Typography>
          {info.row.original.tiene_descuento && (
            <Typography variant="caption" color="text.secondary">
              (Base: Bs. {info.row.original.monto_base.toFixed(2)})
            </Typography>
          )}
        </Box>
      ),
    }),
    columnHelper.accessor('fecha_vencimiento', {
      header: 'Vencimiento',
      cell: (info) => formatters.formatDate(info.getValue()),
    }),
    columnHelper.accessor('estado', {
      header: 'Estado',
      cell: (info) => {
        const estado = info.getValue()
        const color = estado === ESTADO_PAGO.VENCIDO ? 'error' : 'warning'
        const label = estado === ESTADO_PAGO.VENCIDO ? 'Vencido' : 'Pendiente'
        return <Chip label={label} color={color} size="small" variant="outlined" />
      },
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <Box textAlign="right">Acciones</Box>,
      cell: (info) => (
        <Box textAlign="right">
          <Tooltip title="Editar Pago">
            <IconButton
              color="primary"
              size="small"
              onClick={() => {
                setSelectedPago(info.row.original)
                setOpenEditarDialog(true)
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar pago">
            <IconButton
              color="error"
              size="small"
              onClick={() => requestDelete(info.row.original)}
              disabled={deleting === info.row.original.id}
            >
              {deleting === info.row.original.id ? (
                <CircularProgress size={20} />
              ) : (
                <DeleteIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }),
  ], [deleting, requestDelete])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      rowSelection: selectedPagos.reduce((acc, id) => ({ ...acc, [id]: true }), {}),
    },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(table.getState().rowSelection) : updater
      const selectedIds = Object.keys(newSelection).filter(key => newSelection[key])
      setSelectedPagos(selectedIds)
    },
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

  const handleRegistrarSuccess = async () => {
    setOpenRegistrarDialog(false)
    setSelectedPagos([])
    await fetchPagos()
    onPagoDeleted?.()
  }

  if (loading && pagos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    )
  }

  if (fetchError) {
    return (
      <Box p={2}>
        <Alert severity="error">{fetchError}</Alert>
      </Box>
    )
  }

  if (pagos.length === 0) {
    return (
      <Box p={5} textAlign="center">
        <Typography color="text.secondary">
          No hay pagos pendientes para {judokaNombre}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={3}>
        <TextField
          size="small"
          placeholder="Buscar por concepto o descripción..."
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
        <Button
          variant="contained"
          color="success"
          startIcon={<PaymentIcon />}
          onClick={() => setOpenRegistrarDialog(true)}
          disabled={selectedPagos.length === 0}
          sx={{ height: 40, textTransform: 'none', fontWeight: 'bold', whiteSpace: 'nowrap' }}
        >
          Registrar Seleccionados ({selectedPagos.length})
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
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
              <TableRow key={row.id} hover selected={row.getIsSelected()}>
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

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!pagoToDelete}
        title="Eliminar pago"
        message={`¿Estás seguro de eliminar el pago "${pagoToDelete?.concepto}"? Esta acción lo marcará como inactivo.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />

      {/* Error snackbar */}
      <Snackbar
        open={!!deleteError}
        autoHideDuration={4000}
        onClose={clearDeleteError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearDeleteError} sx={{ width: '100%' }}>
          {deleteError}
        </Alert>
      </Snackbar>

      <Dialog open={openRegistrarDialog} onClose={() => setOpenRegistrarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Registrar Pagos</DialogTitle>
        <DialogContent dividers>
          <RegistrarPagoForm
            pagos={pagos.filter(p => selectedPagos.includes(p.id))}
            onSuccess={handleRegistrarSuccess}
            onCancel={() => setOpenRegistrarDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openEditarDialog} onClose={() => setOpenEditarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Editar Pago</DialogTitle>
        <DialogContent dividers>
          {selectedPago && (
            <EditarPagoForm
              pago={selectedPago}
              onSuccess={async () => {
                setOpenEditarDialog(false)
                setSelectedPago(null)
                await fetchPagos()
                onPagoDeleted?.()
              }}
              onCancel={() => setOpenEditarDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}