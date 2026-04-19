'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Stack,
  TextField,
  Skeleton,
  Alert,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import GroupIcon from '@mui/icons-material/Group'
import EventIcon from '@mui/icons-material/Event'
import PersonIcon from '@mui/icons-material/Person'
import SchoolIcon from '@mui/icons-material/School'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useStatsBySensei, useReporteClub, useStatsJudokasByClub } from '@/hooks/useAsistenciaStats'
import KpiCard from '@/components/asistencia/stats/KpiCard'
import SenseiStatsTable from '@/components/asistencia/stats/SenseiStatsTable'
import dayjs from 'dayjs'

const HOY = dayjs().format('YYYY-MM-DD')
const HACE_30 = dayjs().subtract(30, 'day').format('YYYY-MM-DD')

function getColorByPct(pct: number): 'success' | 'warning' | 'error' | 'primary' {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  if (pct > 0) return 'error'
  return 'primary'
}

export default function EstadisticasPage() {
  const { user } = useAuth()
  const isSensei = user?.rol === ROL.SENSEI
  const isEncargado = user?.rol === ROL.ENCARGADO
  const isAdmin = user?.rol === ROL.ADMIN

  const senseiId = user?.sensei_id ?? ''
  const clubId = user?.club_id ?? ''

  // Los encargados/admin tienen fechas requeridas; senseis las fechas son opcionales
  const [fechaInicio, setFechaInicio] = useState(isEncargado || isAdmin ? HACE_30 : '')
  const [fechaFin, setFechaFin] = useState(isEncargado || isAdmin ? HOY : '')
  const [vistaDesglose, setVistaDesglose] = useState<'sensei' | 'judoka'>('sensei')
  const [senseiFiltroDesglose, setSenseiFiltroDesglose] = useState<string>('all')

  const hayFiltros = fechaInicio !== '' || fechaFin !== ''
  const filtrosSensei = hayFiltros
    ? { fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
    : undefined

  const filtrosEncargado = { fecha_inicio: fechaInicio || HACE_30, fecha_fin: fechaFin || HOY }

  // ── Sensei: stats por estudiante ──
  const senseiStatsQuery = useStatsBySensei(
    isSensei ? senseiId : '',
    filtrosSensei
  )

  // ── Encargado/Admin: stats por judoka del club (con filtro opcional de sensei) ──
  const filtrosJudokas = {
    ...filtrosEncargado,
    sensei_id: senseiFiltroDesglose !== 'all' ? senseiFiltroDesglose : undefined,
  }
  const judokasClubQuery = useStatsJudokasByClub(
    (isEncargado || isAdmin) ? clubId : '',
    filtrosJudokas
  )

  // ── Encargado/Admin: reporte del club ──
  const reporteQuery = useReporteClub(
    isEncargado || isAdmin ? clubId : '',
    filtrosEncargado
  )

  const senseiStats = senseiStatsQuery.data ?? []
  const reporte = reporteQuery.data

  const isLoading = isSensei ? senseiStatsQuery.isLoading : reporteQuery.isLoading
  const error = isSensei ? senseiStatsQuery.error?.message : reporteQuery.error?.message

  const estadisticasSensei = useMemo(() => {
    if (!isSensei || senseiStats.length === 0) return null
    const totalAlumnos = senseiStats.length
    const prom = senseiStats.reduce((acc, s) => acc + s.porcentaje, 0) / totalAlumnos
    const sobre80 = senseiStats.filter(s => s.porcentaje >= 80).length
    return { totalAlumnos, promedio: prom, sobre80 }
  }, [senseiStats, isSensei])

  const subtituloPeriodo = hayFiltros
    ? `${fechaInicio ? dayjs(fechaInicio).format('D MMM') : '—'} → ${fechaFin ? dayjs(fechaFin).format('D MMM YYYY') : 'hoy'}`
    : 'Todos los registros'

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.SENSEI, ROL.ENCARGADO]}>
      <Box>
        {/* ── Header ── */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={4}>
          <InsightsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Estadísticas de Asistencia
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSensei ? 'Rendimiento de tus estudiantes' : 'Reporte del club por período'}
            </Typography>
          </Box>
        </Stack>

        {/* ── Filtros ── */}
        <Box
          sx={{
            mb: 3, p: 2, border: '1px solid', borderColor: 'divider',
            borderRadius: 2, bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5} flexWrap="wrap">
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="600">
              Período de análisis
            </Typography>
            {hayFiltros && !(isEncargado || isAdmin) && (
              <Chip
                label="Limpiar"
                size="small"
                icon={<ClearIcon />}
                onClick={() => { setFechaInicio(''); setFechaFin('') }}
                variant="outlined"
                clickable
                sx={{ cursor: 'pointer' }}
              />
            )}
            {(isEncargado || isAdmin) && (
              <Chip label="Obligatorio para encargado" size="small" variant="outlined" color="primary" />
            )}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              label="Desde"
              type="date"
              size="small"
              fullWidth
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: fechaFin || HOY }}
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              fullWidth
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: fechaInicio, max: HOY }}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* ══ VISTA SENSEI ══ */}
        {isSensei && (
          <>
            {isLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={180} />)}
              </Box>
            ) : estadisticasSensei ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
                <KpiCard
                  label="Promedio del grupo"
                  value={estadisticasSensei.promedio}
                  color={getColorByPct(estadisticasSensei.promedio)}
                  subtitle={subtituloPeriodo}
                  icon={<InsightsIcon fontSize="small" />}
                />
                <KpiCard
                  label="Total estudiantes"
                  value={estadisticasSensei.totalAlumnos}
                  isPercentage={false}
                  color="primary"
                  subtitle="Con al menos una sesión en el período"
                  icon={<GroupIcon fontSize="small" />}
                />
                <KpiCard
                  label="Con ≥ 80% asistencia"
                  value={estadisticasSensei.sobre80}
                  isPercentage={false}
                  color={estadisticasSensei.sobre80 === estadisticasSensei.totalAlumnos ? 'success' : 'warning'}
                  subtitle={`de ${estadisticasSensei.totalAlumnos} estudiante${estadisticasSensei.totalAlumnos === 1 ? '' : 's'}`}
                  icon={<GroupIcon fontSize="small" />}
                />
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                Sin datos para el período seleccionado. Ajusta las fechas o asegúrate de haber tomado lista.
              </Alert>
            )}

            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" fontWeight="600" mb={2}>Detalle por estudiante</Typography>

            {isLoading ? (
              <Stack spacing={1}>{[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={44} />)}</Stack>
            ) : (
              <SenseiStatsTable stats={senseiStats} />
            )}
          </>
        )}

        {/* ══ VISTA ENCARGADO / ADMIN ══ */}
        {(isEncargado || isAdmin) && (
          <>
            {isLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 4 }}>
                {[1, 2].map(i => <Skeleton key={i} variant="rounded" height={180} />)}
              </Box>
            ) : reporte ? (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 4 }}>
                  <KpiCard
                    label="Promedio de asistencia del club"
                    value={reporte.stats_globales.promedio_asistencia}
                    color={getColorByPct(reporte.stats_globales.promedio_asistencia)}
                    subtitle={subtituloPeriodo}
                    icon={<InsightsIcon fontSize="small" />}
                  />
                  <KpiCard
                    label="Sesiones en el período"
                    value={reporte.stats_globales.total_sesiones}
                    isPercentage={false}
                    color="primary"
                    subtitle={subtituloPeriodo}
                    icon={<EventIcon fontSize="small" />}
                    secondaryStats={[
                      { label: 'Senseis activos', value: reporte.stats_por_sensei.length },
                      { label: 'Prom. por sensei', value: reporte.stats_por_sensei.length > 0 ? Math.round(reporte.stats_globales.total_sesiones / reporte.stats_por_sensei.length) : 0 },
                    ]}
                  />
                </Box>

                {/* Desglose con toggle y filtro por sensei */}
                <Divider sx={{ mb: 2.5 }} />
                <Box mb={2.5}>
                  <Typography variant="h6" fontWeight="700" mb={1.5}>
                    Desglose
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: reporte.stats_por_sensei.length > 1 ? '1fr auto' : '1fr', gap: 1.5, alignItems: 'center' }}>
                    {/* Filtro por sensei — ocupa todo el espacio disponible */}
                    {reporte.stats_por_sensei.length > 1 && (
                      <FormControl size="small" fullWidth>
                        <InputLabel>Filtrar por sensei</InputLabel>
                        <Select
                          label="Filtrar por sensei"
                          value={senseiFiltroDesglose}
                          onChange={e => setSenseiFiltroDesglose(e.target.value)}
                        >
                          <MenuItem value="all">Todos los senseis</MenuItem>
                          {reporte.stats_por_sensei.map(s => (
                            <MenuItem key={s.sensei_id} value={s.sensei_id}>{s.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {/* Toggle vista — siempre a la derecha */}
                    <ToggleButtonGroup
                      value={vistaDesglose}
                      exclusive
                      size="small"
                      onChange={(_, v) => { if (v) setVistaDesglose(v) }}
                      aria-label="Vista de desglose"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      <ToggleButton value="sensei" aria-label="Por sensei">
                        <SchoolIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Por Sensei
                      </ToggleButton>
                      <ToggleButton value="judoka" aria-label="Por judoka">
                        <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Por Judoka
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>

                {/* Tabla por Sensei */}
                {vistaDesglose === 'sensei' && (
                  reporte.stats_por_sensei.length === 0 ? (
                    <Alert severity="info">Sin sesiones en el período.</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small" aria-label="Estadísticas por sensei">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Sensei</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Sesiones</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>% Asistencia prom.</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reporte.stats_por_sensei
                            .filter(s => senseiFiltroDesglose === 'all' || s.sensei_id === senseiFiltroDesglose)
                            .map(s => {
                            const pct = Math.round(s.promedio_asistencia)
                            return (
                              <TableRow key={s.sensei_id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell><Typography variant="body2" fontWeight="500">{s.nombre}</Typography></TableCell>
                                <TableCell align="center"><Typography variant="body2">{s.total_sesiones}</Typography></TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
                                    <LinearProgress variant="determinate" value={pct} color={getColorByPct(pct) as 'success' | 'warning' | 'error' | 'primary'} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                                    <Chip label={`${pct}%`} color={getColorByPct(pct) as 'success' | 'warning' | 'error' | 'primary'} size="small" variant="outlined" sx={{ minWidth: 54 }} />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
                )}

                {/* Tabla por Judoka */}
                {vistaDesglose === 'judoka' && (
                  judokasClubQuery.isLoading ? (
                    <Stack spacing={1}>{[1,2,3,4].map(i => <Skeleton key={i} variant="rounded" height={44} />)}</Stack>
                  ) : (judokasClubQuery.data?.length ?? 0) === 0 ? (
                    <Alert severity="info">Sin registros de asistencia en el período.</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small" aria-label="Estadísticas por judoka">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Judoka</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Presentes</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Ausentes</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>% Asistencia</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(judokasClubQuery.data ?? []).map(j => {
                            const pct = Math.round(j.porcentaje)
                            return (
                              <TableRow key={j.judoka_id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="500">
                                    {j.apellido_judoka} {j.nombre_judoka}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={j.presentes} size="small" color="success" variant="outlined" />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={j.ausentes} size="small" color={j.ausentes === 0 ? 'default' : 'error'} variant="outlined" />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
                                    <LinearProgress variant="determinate" value={pct} color={getColorByPct(pct) as 'success' | 'warning' | 'error' | 'primary'} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                                    <Chip label={`${pct}%`} color={getColorByPct(pct) as 'success' | 'warning' | 'error' | 'primary'} size="small" variant="outlined" sx={{ minWidth: 54 }} />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                Sin datos para el período seleccionado.
              </Alert>
            )}
          </>
        )}
      </Box>
    </ProtectedRoute>
  )
}
