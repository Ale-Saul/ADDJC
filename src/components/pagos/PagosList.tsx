'use client'

import { useState, useEffect } from 'react'
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
  Button
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PaymentIcon from '@mui/icons-material/Payment'
import EditIcon from '@mui/icons-material/Edit'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import RegistrarPagoForm from './RegistrarPagoForm'
import EditarPagoForm from './EditarPagoForm'
import { formatters } from '@/utils/formatters'
import { ESTADO_PAGO, TIPO_PAGO_LABELS } from '@/constants/pagos'

interface PagosListProps {
  judokaId: string
  judokaNombre: string
  onPagoDeleted?: () => void
}

export default function PagosList({ judokaId, judokaNombre, onPagoDeleted }: PagosListProps) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [openRegistrarDialog, setOpenRegistrarDialog] = useState(false)
  const [openEditarDialog, setOpenEditarDialog] = useState(false)
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null)
  const [selectedPagos, setSelectedPagos] = useState<string[]>([])

  const fetchPagos = async () => {
    try {
      const response = await pagoController.getPagosByJudoka(judokaId)
      if (response.success && response.data) {
        // Filtrar solo pagos pendientes y vencidos
        const pagosPendientes = response.data.filter(
          p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO
        )
        setPagos(pagosPendientes)
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPagos()
  }, [judokaId])

  const handleDelete = async (pago: Pago) => {
    if (!confirm(`¿Estás seguro de eliminar el pago "${pago.concepto}"?`)) {
      return
    }

    setDeleting(pago.id)
    try {
      const response = await pagoController.deletePago(pago.id)
      if (response.success) {
        await fetchPagos()
        onPagoDeleted?.()
      } else {
        alert(`Error al eliminar: ${response.error}`)
      }
    } catch (error) {
      console.error('Error al eliminar pago:', error)
      alert('Error inesperado al eliminar el pago')
    } finally {
      setDeleting(null)
    }
  }

  const handleRegistrarPagos = () => {
    if (selectedPagos.length === 0) return
    setOpenRegistrarDialog(true)
  }

  const handleRegistrarSuccess = async () => {
    setOpenRegistrarDialog(false)
    setSelectedPagos([])
    await fetchPagos()
    onPagoDeleted?.()
  }

  const handleTogglePago = (pagoId: string) => {
    setSelectedPagos(prev => 
      prev.includes(pagoId) 
        ? prev.filter(id => id !== pagoId)
        : [...prev, pagoId]
    )
  }

  const handleToggleAll = () => {
    if (selectedPagos.length === pagos.length) {
      setSelectedPagos([])
    } else {
      setSelectedPagos(pagos.map(p => p.id))
    }
  }

  const handleEditarPago = (pago: Pago) => {
    setSelectedPago(pago)
    setOpenEditarDialog(true)
  }

  const handleEditarSuccess = async () => {
    setOpenEditarDialog(false)
    setSelectedPago(null)
    await fetchPagos()
    onPagoDeleted?.()
  }

  const handleEditarCancel = () => {
    setOpenEditarDialog(false)
    setSelectedPago(null)
  }

  const getEstadoChip = (estado: string) => {
    const colores: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
      [ESTADO_PAGO.PAGADO]: 'success',
      [ESTADO_PAGO.PENDIENTE]: 'warning',
      [ESTADO_PAGO.VENCIDO]: 'error',
      [ESTADO_PAGO.CANCELADO]: 'default',
      [ESTADO_PAGO.REEMBOLSADO]: 'info'
    }

    const labels: Record<string, string> = {
      [ESTADO_PAGO.PAGADO]: 'Pagado',
      [ESTADO_PAGO.PENDIENTE]: 'Pendiente',
      [ESTADO_PAGO.VENCIDO]: 'Vencido',
      [ESTADO_PAGO.CANCELADO]: 'Cancelado',
      [ESTADO_PAGO.REEMBOLSADO]: 'Reembolsado'
    }

    return (
      <Chip 
        label={labels[estado] || estado} 
        color={colores[estado] || 'default'} 
        size="small" 
      />
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  if (pagos.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="text.secondary">
          No hay pagos pendientes para {judokaNombre}
        </Typography>
      </Box>
    )
  }

  return (
    <>
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        variant="contained"
        color="success"
        startIcon={<PaymentIcon />}
        onClick={handleRegistrarPagos}
        disabled={selectedPagos.length === 0}
      >
        Registrar Pagos Seleccionados ({selectedPagos.length})
      </Button>
    </Box>
    
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={pagos.length > 0 && selectedPagos.length === pagos.length}
                indeterminate={selectedPagos.length > 0 && selectedPagos.length < pagos.length}
                onChange={handleToggleAll}
              />
            </TableCell>
            <TableCell>Concepto</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell>Vencimiento</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pagos.map((pago) => (
            <TableRow key={pago.id} hover selected={selectedPagos.includes(pago.id)}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedPagos.includes(pago.id)}
                  onChange={() => handleTogglePago(pago.id)}
                />
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {pago.concepto}
                  </Typography>
                  {pago.descripcion && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {pago.descripcion}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {TIPO_PAGO_LABELS[pago.tipo_pago as keyof typeof TIPO_PAGO_LABELS] || pago.tipo_pago}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Bs. {pago.monto_final.toFixed(2)}
                  </Typography>
                  {pago.tiene_descuento && (
                    <Typography variant="caption" color="text.secondary">
                      (Base: Bs. {pago.monto_base.toFixed(2)})
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>{formatters.formatDate(pago.fecha_vencimiento)}</TableCell>
              <TableCell>{getEstadoChip(pago.estado)}</TableCell>
              <TableCell align="center">
                {(pago.estado === ESTADO_PAGO.PENDIENTE || pago.estado === ESTADO_PAGO.VENCIDO) && (
                  <Tooltip title="Editar Pago">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditarPago(pago)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Eliminar pago">
                  <span>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(pago)}
                      disabled={deleting === pago.id}
                    >
                      {deleting === pago.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    <Dialog open={openRegistrarDialog} onClose={() => setOpenRegistrarDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        Registrar Pagos ({selectedPagos.length} {selectedPagos.length === 1 ? 'pago' : 'pagos'})
      </DialogTitle>
      <DialogContent>
        <RegistrarPagoForm
          pagos={pagos.filter(p => selectedPagos.includes(p.id))}
          onSuccess={handleRegistrarSuccess}
          onCancel={() => setOpenRegistrarDialog(false)}
        />
      </DialogContent>
    </Dialog>

    <Dialog open={openEditarDialog} onClose={handleEditarCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Pago</DialogTitle>
      <DialogContent>
        {selectedPago && (
          <EditarPagoForm
            pago={selectedPago}
            onSuccess={handleEditarSuccess}
            onCancel={handleEditarCancel}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
