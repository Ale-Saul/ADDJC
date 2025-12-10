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
  Tooltip
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'

interface PagosListProps {
  judokaId: string
  judokaNombre: string
  onPagoDeleted?: () => void
}

export default function PagosList({ judokaId, judokaNombre, onPagoDeleted }: PagosListProps) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPagos = async () => {
    try {
      const response = await pagoController.getPagosByJudoka(judokaId)
      if (response.success && response.data) {
        setPagos(response.data)
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

  const getEstadoChip = (estado: string) => {
    const colores: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
      pagado: 'success',
      pendiente: 'warning',
      vencido: 'error',
      parcial: 'info',
      cancelado: 'default'
    }

    const labels: Record<string, string> = {
      pagado: 'Pagado',
      pendiente: 'Pendiente',
      vencido: 'Vencido',
      parcial: 'Parcial',
      cancelado: 'Cancelado'
    }

    return (
      <Chip 
        label={labels[estado] || estado} 
        color={colores[estado] || 'default'} 
        size="small" 
      />
    )
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          No hay pagos registrados para {judokaNombre}
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
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
            <TableRow key={pago.id} hover>
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
                  {pago.tipo_pago.replace('_', ' ')}
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
              <TableCell>{formatFecha(pago.fecha_vencimiento)}</TableCell>
              <TableCell>{getEstadoChip(pago.estado)}</TableCell>
              <TableCell align="center">
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
  )
}
