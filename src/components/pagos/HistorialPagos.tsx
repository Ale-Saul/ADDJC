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

interface HistorialPagosProps {
  judokaId: string
  judokaNombre: string
}

export default function HistorialPagos({ judokaId, judokaNombre }: HistorialPagosProps) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPagos = async () => {
    try {
      const response = await pagoController.getPagosByJudoka(judokaId)
      if (response.success && response.data) {
        // Filtrar solo pagos pagados, parciales o cancelados
        const pagosPagados = response.data.filter(
          p => p.estado === 'pagado' || p.estado === 'parcial' || p.estado === 'cancelado'
        )
        setPagos(pagosPagados)
      }
    } catch (error) {
      console.error('Error al cargar historial de pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPagos()
  }, [judokaId])

  const getEstadoChip = (estado: string) => {
    const colores: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
      pagado: 'success',
      parcial: 'info',
      cancelado: 'default'
    }

    const labels: Record<string, string> = {
      pagado: 'Pagado',
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
          No hay pagos completados para {judokaNombre}
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
            <TableCell>Fecha Pago</TableCell>
            <TableCell>Método</TableCell>
            <TableCell>Estado</TableCell>
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
                  {pago.observaciones_pago && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                      📝 {pago.observaciones_pago}
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
              <TableCell>
                {pago.fecha_pago ? formatFecha(pago.fecha_pago) : '-'}
              </TableCell>
              <TableCell>
                {pago.metodo_pago ? (
                  <Chip label={pago.metodo_pago} size="small" variant="outlined" />
                ) : '-'}
              </TableCell>
              <TableCell>{getEstadoChip(pago.estado)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
