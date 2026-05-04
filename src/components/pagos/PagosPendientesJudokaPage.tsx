'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import PaymentIcon from '@mui/icons-material/Payment'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePagosPendientesJudoka } from '@/hooks/usePagosPendientesJudoka'
import { ESTADO_PAGO, TIPO_PAGO_LABELS } from '@/constants/pagos'
import { formatters } from '@/utils/formatters'
import type { Pago } from '@/models/pago'
import Pagination from '@/components/common/Pagination'

function getEstadoVisual(pago: Pago): { label: string; color: 'warning' | 'error' | 'default' } {
  const hoy = new Date()
  const vencimiento = new Date(`${pago.fecha_vencimiento}T00:00:00`)
  const estaVencido = pago.estado === ESTADO_PAGO.VENCIDO || vencimiento < new Date(hoy.toDateString())

  if (estaVencido) return { label: 'Vencido', color: 'error' }
  return { label: 'Pendiente', color: 'warning' }
}

export default function PagosPendientesJudokaPage() {
  const { user } = useAuth()
  const usuarioId = user?.id
  const { data: pagos = [], isLoading, isError } = usePagosPendientesJudoka(usuarioId)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const totalPendiente = pagos.reduce((sum, pago) => sum + (pago.monto_final ?? 0), 0)
  const totalPages = Math.ceil(pagos.length / itemsPerPage)
  const currentPage = Math.min(page, totalPages || 1)
  const pagosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return pagos.slice(start, start + itemsPerPage)
  }, [pagos, currentPage, itemsPerPage])

  return (
    <Box>
      <PageHeader title="Mis pagos pendientes" />

      {isLoading ? (
        <Box sx={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">No se pudieron cargar tus pagos pendientes.</Alert>
      ) : pagos.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ py: 8, px: 3, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}
        >
          <PaymentIcon sx={{ fontSize: 56, color: 'success.main', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700}>
            No tienes pagos pendientes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Cuando tu club registre una cuota o pago, aparecerá aquí.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total pendiente
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {formatters.formatCurrency(totalPendiente)}
                  </Typography>
                </Box>
                <Chip
                  icon={<EventBusyIcon />}
                  label={`${pagos.length} pago${pagos.length !== 1 ? 's' : ''} por resolver`}
                  color="warning"
                  variant="outlined"
                  sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={1.5}>
            {pagosPaginados.map(pago => {
              const estado = getEstadoVisual(pago)
              return (
                <Card key={pago.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {pago.concepto}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {TIPO_PAGO_LABELS[pago.tipo_pago] ?? pago.tipo_pago}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={estado.label} color={estado.color} size="small" />
                          <Typography variant="h6" fontWeight={800}>
                            {formatters.formatCurrency(pago.monto_final)}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Divider />

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Typography variant="body2" color="text.secondary">
                          Vence: <strong>{formatters.formatDate(pago.fecha_vencimiento)}</strong>
                        </Typography>
                        {pago.descripcion && (
                          <Typography variant="body2" color="text.secondary">
                            {pago.descripcion}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagos.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 20]}
          />
        </Stack>
      )}
    </Box>
  )
}
