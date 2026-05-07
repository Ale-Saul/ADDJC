'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Stack,
  TextField,
  Skeleton,
  Alert,
  Chip,
} from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useStatsJudoka } from '@/hooks/useAsistenciaStats'
import { useHistorialJudoka } from '@/hooks/useAsistenciaDetalle'
import KpiCard from '@/components/asistencia/stats/KpiCard'
import HistorialTable from '@/components/asistencia/stats/HistorialTable'
import BarChartIcon from '@mui/icons-material/BarChart'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/es'
import dayjs from 'dayjs'

dayjs.locale('es')

function getColorByPct(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
}

const HOY = dayjs().format('YYYY-MM-DD')
const HACE_UN_MES = dayjs().subtract(1, 'month').format('YYYY-MM-DD')

export default function MiAsistenciaPage() {
  const { user } = useAuth()
  const judokaId = user?.judoka_id ?? ''

  const [fechaInicio, setFechaInicio] = useState(HACE_UN_MES)
  const [fechaFin, setFechaFin] = useState(HOY)
  const hayFiltros = fechaInicio !== HACE_UN_MES || fechaFin !== HOY

  const filtros = { fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }

  const statsQuery = useStatsJudoka(judokaId, filtros)
  const historialQuery = useHistorialJudoka(judokaId, filtros)

  const stats = statsQuery.data
  const historial = historialQuery.data ?? []
  const isLoading = statsQuery.isLoading || historialQuery.isLoading

  return (
    <ProtectedRoute allowedRoles={[ROL.JUDOKA]}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <Box>
          {/* ── Header ── */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={4}>
          <InsightsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Mi Asistencia
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tu porcentaje de asistencia y resumen por periodo
            </Typography>
          </Box>
        </Stack>

        {/* ── Filtro de fechas ── */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5} flexWrap="wrap">
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="600">
              Filtrar por periodo
            </Typography>
            {hayFiltros && (
              <Chip
                label="Limpiar"
                size="small"
                icon={<ClearIcon />}
                onClick={() => { setFechaInicio(HACE_UN_MES); setFechaFin(HOY) }}
                variant="outlined"
                clickable
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <DatePicker
              label="Desde"
              format="DD/MM/YYYY"
              value={fechaInicio ? dayjs(fechaInicio) : null}
              onChange={(newValue) => setFechaInicio(newValue ? newValue.format('YYYY-MM-DD') : '')}
              maxDate={fechaFin ? dayjs(fechaFin) : dayjs()}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  fullWidth: true,
                  InputLabelProps: { shrink: true }
                } 
              }}
            />
            <DatePicker
              label="Hasta"
              format="DD/MM/YYYY"
              value={fechaFin ? dayjs(fechaFin) : null}
              onChange={(newValue) => setFechaFin(newValue ? newValue.format('YYYY-MM-DD') : '')}
              minDate={fechaInicio ? dayjs(fechaInicio) : undefined}
              maxDate={dayjs()}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  fullWidth: true,
                  InputLabelProps: { shrink: true }
                } 
              }}
            />
          </Box>
        </Box>

        {/* ── KPIs ── */}
        {isLoading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={180} />)}
          </Box>
        ) : statsQuery.error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {statsQuery.error?.message ?? 'Error al cargar tus estadísticas.'}
          </Alert>
        ) : !judokaId ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tu perfil de judoka no está vinculado. Contacta al encargado de tu club.
          </Alert>
        ) : stats ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
            <KpiCard
              label="Rendimiento de Asistencia"
              value={stats.porcentaje}
              color={getColorByPct(stats.porcentaje)}
              subtitle={
                hayFiltros
                  ? `Periodo: ${fechaInicio ? dayjs(fechaInicio).format('DD/MM') : '—'} al ${fechaFin ? dayjs(fechaFin).format('DD/MM/YY') : 'hoy'}`
                  : 'Resumen histórico total'
              }
              icon={<TrendingUpIcon />}
              sx={{ borderLeft: 6, borderColor: `${getColorByPct(stats.porcentaje)}.main` }}
            />
            <KpiCard
              label="Clases Asistidas"
              value={stats.presentes}
              isPercentage={false}
              color="success"
              subtitle={`De un total de ${stats.total_sesiones} clases`}
              icon={<CheckCircleOutlineIcon color="success" />}
            />
            <KpiCard
              label="Inasistencias"
              value={stats.ausentes}
              isPercentage={false}
              color={stats.ausentes === 0 ? 'success' : stats.ausentes <= 2 ? 'warning' : 'error'}
              subtitle={stats.ausentes === 0 ? '¡Excelente asistencia!' : `Has faltado a ${stats.ausentes} clase${stats.ausentes === 1 ? '' : 's'}`}
              icon={<HighlightOffIcon color={stats.ausentes === 0 ? 'success' : 'error'} />}
            />
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            {hayFiltros
              ? 'Sin registros en el periodo seleccionado.'
              : 'Aún no tienes sesiones de asistencia registradas.'}
          </Alert>
        )}

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventAvailableIcon color="action" />
          <Typography variant="h6" fontWeight="bold">
            Historial Detallado
          </Typography>
        </Box>

        {historialQuery.isLoading ? (
          <Stack spacing={1}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={44} />)}
          </Stack>
        ) : (
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <HistorialTable historial={historial} />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  </ProtectedRoute>
  )
}
