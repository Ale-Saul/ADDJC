'use client'

import { useQuery } from '@tanstack/react-query'
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
import { Pago, EstadoPago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { formatters } from '@/utils/formatters'

interface HistorialPagosProps {
  judokaId: string
  judokaNombre: string
}

export default function HistorialPagos({ judokaId, judokaNombre }: HistorialPagosProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pagos', 'historial', judokaId],
    queryFn: async () => {
      const response = await pagoController.getPagosByJudoka(judokaId)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Error al cargar historial')
      }
      return response.data.filter(
        p => p.estado === 'pagado' || p.estado === 'cancelado'
      )
    }
  })

  // Renombramos por compatibilidad local
  const loading = isLoading
  const pagos = data || []

  const getEstadoChip = (estado: string) => {
    const estadoPago = estado as EstadoPago
    const colores: Record<EstadoPago, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
      pagado: 'success',
      cancelado: 'default',
      pendiente: 'warning',
      vencido: 'error',
      reembolsado: 'default'
    }

    const labels: Record<string, string> = {
      pagado: 'Pagado',
      cancelado: 'Cancelado',
      pendiente: 'Pendiente',
      vencido: 'Vencido',
      reembolsado: 'Reembolsado'
    }

    return (
      <Chip
        label={labels[estado] || estado}
        color={colores[estadoPago] || 'default'}
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
                       {pago.observaciones_pago}
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
                  {pago.tiene_descuento && typeof pago.monto_base === 'number' && (
                    <Typography variant="caption" color="text.secondary">
                      (Base: Bs. {pago.monto_base.toFixed(2)})
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {pago.fecha_pago ? formatters.formatDate(pago.fecha_pago) : '-'}
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

