'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import PaymentIcon from '@mui/icons-material/Payment'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HistoryIcon from '@mui/icons-material/History'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePagosPendientesJudoka, usePagosHistorialJudoka } from '@/hooks/usePagosPendientesJudoka'
import { ESTADO_PAGO, TIPO_PAGO_LABELS, METODO_PAGO_LABELS } from '@/constants/pagos'
import { formatters } from '@/utils/formatters'
import type { Pago } from '@/models/pago'
import Pagination from '@/components/common/Pagination'

// ─── Helpers visuales ────────────────────────────────────────────────────────

type EstadoVisualPendiente = { label: string; color: 'warning' | 'error' }
type EstadoVisualHistorial = { label: string; color: 'success' | 'default' | 'error' }

function getEstadoPendiente(pago: Pago): EstadoVisualPendiente {
  const vencimiento = new Date(`${pago.fecha_vencimiento}T00:00:00`)
  const estaVencido = pago.estado === ESTADO_PAGO.VENCIDO || vencimiento < new Date(new Date().toDateString())
  if (estaVencido) return { label: 'Vencido', color: 'error' }
  return { label: 'Pendiente', color: 'warning' }
}

function getEstadoHistorial(pago: Pago): EstadoVisualHistorial {
  const estado = pago.estado as string
  if (estado === ESTADO_PAGO.PAGADO || estado === 'pago' || estado === 'completado') {
    return { label: 'Pagado', color: 'success' }
  }
  if (estado === ESTADO_PAGO.REEMBOLSADO) return { label: 'Reembolsado', color: 'default' }
  if (estado === ESTADO_PAGO.CANCELADO) return { label: 'Cancelado', color: 'error' }
  return { label: estado, color: 'default' }
}

function toYmd(value: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

/** Fecha de referencia para filtrar historial: pago realizado o última actualización. */
function getFechaRefHistorial(pago: Pago): string {
  if (pago.fecha_pago) return toYmd(pago.fecha_pago)
  return toYmd(pago.updated_at) || toYmd(pago.fecha_vencimiento)
}

function crearRangoDefaultMes(): { desde: string; hasta: string } {
  const ref = dayjs()
  return {
    desde: ref.subtract(1, 'month').format('YYYY-MM-DD'),
    hasta: ref.add(1, 'month').format('YYYY-MM-DD'),
  }
}

function pagoPendienteEnRango(pago: Pago, desde: string, hasta: string): boolean {
  const d = toYmd(pago.fecha_vencimiento)
  return !!d && d >= desde && d <= hasta
}

function pagoHistorialEnRango(pago: Pago, desde: string, hasta: string): boolean {
  const d = getFechaRefHistorial(pago)
  return !!d && d >= desde && d <= hasta
}

// ─── Card de pago pendiente ──────────────────────────────────────────────────

function PagoPendienteCard({ pago }: { pago: Pago }) {
  const estado = getEstadoPendiente(pago)
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
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
}

// ─── Card de pago del historial ──────────────────────────────────────────────

function PagoHistorialCard({ pago }: { pago: Pago }) {
  const estado = getEstadoHistorial(pago)
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
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
              <Typography variant="h6" fontWeight={800} color="text.secondary">
                {formatters.formatCurrency(pago.monto_final)}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 0.5, sm: 2 }}
            flexWrap="wrap"
          >
            {pago.fecha_pago && (
              <Typography variant="body2" color="text.secondary">
                Pagado el: <strong>{formatters.formatDate(pago.fecha_pago)}</strong>
              </Typography>
            )}
            {pago.metodo_pago && (
              <Typography variant="body2" color="text.secondary">
                Método: <strong>{METODO_PAGO_LABELS[pago.metodo_pago as keyof typeof METODO_PAGO_LABELS] ?? pago.metodo_pago}</strong>
              </Typography>
            )}
            {pago.tiene_descuento && pago.monto_base !== pago.monto_final && (
              <Typography variant="body2" color="success.main">
                Descuento aplicado: <strong>{formatters.formatCurrency(pago.monto_base - pago.monto_final)}</strong>
              </Typography>
            )}
            {pago.observaciones_pago && (
              <Typography variant="body2" color="text.secondary" sx={{ width: '100%' }}>
                {pago.observaciones_pago}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function PagosPendientesJudokaPage() {
  const { user } = useAuth()
  const usuarioId = user?.id

  const { data: pendientes = [], isLoading: loadingPendientes, isError: errorPendientes } = usePagosPendientesJudoka(usuarioId)
  const { data: historial = [], isLoading: loadingHistorial, isError: errorHistorial } = usePagosHistorialJudoka(usuarioId)

  const [fechaDesde, setFechaDesde] = useState(() => crearRangoDefaultMes().desde)
  const [fechaHasta, setFechaHasta] = useState(() => crearRangoDefaultMes().hasta)

  const [tab, setTab] = useState(0)
  const [pagePend, setPagePend] = useState(1)
  const [perPagePend, setPerPagePend] = useState(5)
  const [pageHist, setPageHist] = useState(1)
  const [perPageHist, setPerPageHist] = useState(5)

  const pendientesFiltrados = useMemo(
    () => pendientes.filter(p => pagoPendienteEnRango(p, fechaDesde, fechaHasta)),
    [pendientes, fechaDesde, fechaHasta],
  )
  const historialFiltrado = useMemo(
    () => historial.filter(p => pagoHistorialEnRango(p, fechaDesde, fechaHasta)),
    [historial, fechaDesde, fechaHasta],
  )

  useEffect(() => {
    setPagePend(1)
    setPageHist(1)
  }, [fechaDesde, fechaHasta])

  const hoy = dayjs()
  /** Límite superior razonable para vencimientos futuros en el filtro "Hasta". */
  const maxHastaCalendario = hoy.add(5, 'year')
  const totalPendiente = pendientesFiltrados.reduce((sum, p) => sum + (p.monto_final ?? 0), 0)

  const totalPagesPend = Math.ceil(pendientesFiltrados.length / perPagePend)
  const currentPagePend = Math.min(pagePend, totalPagesPend || 1)
  const pendientesPaginados = useMemo(() => {
    const start = (currentPagePend - 1) * perPagePend
    return pendientesFiltrados.slice(start, start + perPagePend)
  }, [pendientesFiltrados, currentPagePend, perPagePend])

  const totalPagesHist = Math.ceil(historialFiltrado.length / perPageHist)
  const currentPageHist = Math.min(pageHist, totalPagesHist || 1)
  const historialPaginado = useMemo(() => {
    const start = (currentPageHist - 1) * perPageHist
    return historialFiltrado.slice(start, start + perPageHist)
  }, [historialFiltrado, currentPageHist, perPageHist])

  return (
    <Box>
      <PageHeader title="Mis Pagos" />

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FilterListIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>
              Filtrar por fechas
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Pendientes por fecha de vencimiento (por defecto se incluye hasta el próximo mes). Historial: fecha de pago o
              actualización.
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <DatePicker
              label="Desde"
              format="DD/MM/YYYY"
              value={fechaDesde ? dayjs(fechaDesde) : null}
              onChange={(newValue) => setFechaDesde(newValue ? newValue.format('YYYY-MM-DD') : crearRangoDefaultMes().desde)}
              maxDate={fechaHasta ? dayjs(fechaHasta) : maxHastaCalendario}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: { shrink: true },
                },
              }}
            />
            <DatePicker
              label="Hasta"
              format="DD/MM/YYYY"
              value={fechaHasta ? dayjs(fechaHasta) : null}
              onChange={(newValue) => setFechaHasta(newValue ? newValue.format('YYYY-MM-DD') : crearRangoDefaultMes().hasta)}
              minDate={fechaDesde ? dayjs(fechaDesde) : undefined}
              maxDate={maxHastaCalendario}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: { shrink: true },
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* KPIs rápidos */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EventBusyIcon color="warning" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total pendiente
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatters.formatCurrency(totalPendiente)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pendientesFiltrados.length} pago{pendientesFiltrados.length !== 1 ? 's' : ''} por resolver (en el período)
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pagos realizados
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {historialFiltrado.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {historialFiltrado.filter(p => {
                    const e = p.estado as string
                    return e === ESTADO_PAGO.PAGADO || e === 'pago' || e === 'completado'
                  }).length} confirmados (en el período)
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as number)}
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          label={`Pendientes${pendientesFiltrados.length > 0 ? ` (${pendientesFiltrados.length})` : ''}`}
          iconPosition="start"
          icon={<EventBusyIcon fontSize="small" />}
        />
        <Tab
          label={`Historial${historialFiltrado.length > 0 ? ` (${historialFiltrado.length})` : ''}`}
          iconPosition="start"
          icon={<HistoryIcon fontSize="small" />}
        />
      </Tabs>

      {/* ── Tab Pendientes ── */}
      {tab === 0 && (
        <>
          {loadingPendientes ? (
            <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : errorPendientes ? (
            <Alert severity="error">No se pudieron cargar tus pagos pendientes.</Alert>
          ) : pendientesFiltrados.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ py: 8, px: 3, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}
            >
              <PaymentIcon sx={{ fontSize: 56, color: pendientes.length === 0 ? 'success.main' : 'warning.main', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700}>
                {pendientes.length === 0 ? 'No tienes pagos pendientes' : 'Nada en este período'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {pendientes.length === 0
                  ? 'Cuando tu club registre una cuota o pago, aparecerá aquí.'
                  : 'Ajusta las fechas o ampliá el rango para ver otros vencimientos.'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {pendientesPaginados.map(pago => (
                <PagoPendienteCard key={pago.id} pago={pago} />
              ))}
              <Pagination
                currentPage={currentPagePend}
                totalPages={totalPagesPend}
                totalItems={pendientesFiltrados.length}
                itemsPerPage={perPagePend}
                onPageChange={setPagePend}
                onItemsPerPageChange={setPerPagePend}
                itemsPerPageOptions={[5, 10, 20]}
              />
            </Stack>
          )}
        </>
      )}

      {/* ── Tab Historial ── */}
      {tab === 1 && (
        <>
          {loadingHistorial ? (
            <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : errorHistorial ? (
            <Alert severity="error">No se pudo cargar el historial de pagos.</Alert>
          ) : historialFiltrado.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ py: 8, px: 3, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}
            >
              <HistoryIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700}>
                {historial.length === 0 ? 'Sin historial de pagos' : 'Nada en este período'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {historial.length === 0
                  ? 'Aquí aparecerán tus pagos confirmados, cancelados o reembolsados.'
                  : 'Ampliá el rango de fechas para ver movimientos anteriores.'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {historialPaginado.map(pago => (
                <PagoHistorialCard key={pago.id} pago={pago} />
              ))}
              <Pagination
                currentPage={currentPageHist}
                totalPages={totalPagesHist}
                totalItems={historialFiltrado.length}
                itemsPerPage={perPageHist}
                onPageChange={setPageHist}
                onItemsPerPageChange={setPerPageHist}
                itemsPerPageOptions={[5, 10, 20]}
              />
            </Stack>
          )}
        </>
      )}
    </Box>
  )
}
