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
  Typography
} from '@mui/material'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'

interface PagosListProps {
  judokaId: string
  judokaNombre: string
}

export default function PagosList({ judokaId, judokaNombre }: PagosListProps) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

    fetchPagos()
  }, [judokaId])

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
          </TableRow>
        </TableHead>
        <TableBody>
          {pagos.map((pago) => (
            <TableRow key={pago.id} hover>
              <TableCell>{pago.concepto}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
