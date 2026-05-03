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
  Autocomplete,
  Paper,
  Avatar,
  InputAdornment,
} from '@mui/material'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import BadgeIcon from '@mui/icons-material/Badge'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useJudokas } from '@/hooks/useJudokas'
import { useStatsJudoka } from '@/hooks/useAsistenciaStats'
import { useHistorialJudoka } from '@/hooks/useAsistenciaDetalle'
import KpiCard from '@/components/asistencia/stats/KpiCard'
import HistorialTable from '@/components/asistencia/stats/HistorialTable'
import { FormDatePicker } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { Judoka } from '@/models/judoka'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

function getColorByPct(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
}

function getInitials(j: Judoka) {
  return `${j.nombres.charAt(0)}${j.apellidos.charAt(0)}`.toUpperCase()
}

function JudokaInfoBanner({ judoka }: { judoka: Judoka }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'primary.50',
        borderColor: 'primary.200',
        mb: 3,
      }}
    >
      <Avatar
        sx={{
          bgcolor: 'primary.main',
          width: 48,
          height: 48,
          fontSize: '1.1rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {getInitials(judoka)}
      </Avatar>
      <Box flex={1} minWidth={0}>
        <Typography variant="h6" fontWeight="bold" noWrap>
          {judoka.apellidos}, {judoka.nombres}
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" mt={0.25}>
          {judoka.ci && (
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <BadgeIcon sx={{ fontSize: 14 }} color="action" />
              <Typography variant="caption" color="text.secondary">
                CI: {judoka.ci}
              </Typography>
            </Stack>
          )}
          {judoka.cinturon_actual && (
            <Typography variant="caption" color="text.secondary">
              • {judoka.cinturon_actual}
            </Typography>
          )}
          {judoka.nombre_club && (
            <Typography variant="caption" color="text.secondary">
              • {judoka.nombre_club}
            </Typography>
          )}
        </Stack>
      </Box>
    </Paper>
  )
}

function ResumenComision({
  stats,
  judoka,
  periodo,
}: {
  stats: { porcentaje: number; total_sesiones: number; presentes: number; ausentes: number }
  judoka: Judoka
  periodo: { inicio: string; fin: string } | null
}) {
  const pct = Math.round(stats.porcentaje)
  const apto = pct >= 75

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        borderColor: apto ? 'success.main' : 'error.main',
        borderWidth: 2,
        bgcolor: apto ? 'success.50' : 'error.50',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <EmojiEventsIcon color={apto ? 'success' : 'error'} />
        <Typography variant="h6" fontWeight="bold">
          Resumen para comisión de torneos
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ lineHeight: 1.9 }}>
        El judoka <strong>{judoka.apellidos}, {judoka.nombres}</strong>
        {judoka.ci ? ` (CI: ${judoka.ci})` : ''}{' '}
        registra una asistencia de{' '}
        <strong>{pct}%</strong> ({stats.presentes} de {stats.total_sesiones} sesiones
        {periodo
          ? ` del ${dayjs(periodo.inicio).format('D [de] MMMM YYYY')} al ${dayjs(periodo.fin).format('D [de] MMMM YYYY')}`
          : ' en todos los registros disponibles'}
        ).
      </Typography>

      <Box mt={2}>
        <Chip
          label={
            apto
              ? '✓ Cumple el mínimo de asistencia (≥ 75%)'
              : '✗ No cumple el mínimo de asistencia (< 75%)'
          }
          color={apto ? 'success' : 'error'}
          variant="filled"
        />
      </Box>
    </Paper>
  )
}

export default function ConsultaAsistenciaPage() {
  const { control } = useForm({
    defaultValues: {
      fecha_inicio: '',
      fecha_fin: '',
    }
  })
  const [judokaSeleccionado, setJudokaSeleccionado] = useState<Judoka | null>(null)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const hayFiltroFechas = fechaInicio !== '' || fechaFin !== ''

  const { judokas, isLoading: loadingJudokas } = useJudokas({ autoFetch: true })

  const filtros = hayFiltroFechas
    ? { fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
    : undefined

  const judokaId = judokaSeleccionado?.id ?? ''

  const statsQuery = useStatsJudoka(judokaId, filtros)
  const historialQuery = useHistorialJudoka(judokaId, filtros)

  const stats = statsQuery.data
  const historial = historialQuery.data ?? []
  const isLoadingData = statsQuery.isLoading || historialQuery.isLoading

  const periodo =
    hayFiltroFechas && fechaInicio && fechaFin
      ? { inicio: fechaInicio, fin: fechaFin }
      : null

  const judokaOptions = useMemo(
    () =>
      [...judokas].sort((a, b) =>
        `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`)
      ),
    [judokas]
  )

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION]}>
      <Box>
        {/* ── Header ── */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={4}>
          <ManageSearchIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Consulta de Asistencia
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Historial de asistencia de un judoka para justificación en torneos
            </Typography>
          </Box>
        </Stack>

        {/* ── Buscador principal ── */}
        <Box mb={2}>
          <Typography variant="body2" fontWeight="600" color="text.secondary" mb={1}>
            Buscar judoka
          </Typography>
          <Autocomplete
            options={judokaOptions}
            loading={loadingJudokas}
            getOptionLabel={(j) =>
              `${j.apellidos}, ${j.nombres}${j.ci ? ` — CI: ${j.ci}` : ''}`
            }
            renderOption={(props, j) => {
              const { key, ...optionProps } = props as any
              return (
                <Box
                  component="li"
                  key={key || j.id}
                  {...optionProps}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.light', color: 'primary.dark', flexShrink: 0 }}>
                    {getInitials(j)}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography variant="body2" fontWeight="500" noWrap>
                      {j.apellidos}, {j.nombres}
                    </Typography>
                    {(j.ci || j.cinturon_actual || j.nombre_club) && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {[j.ci && `CI: ${j.ci}`, j.cinturon_actual, j.nombre_club]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )
            }}
            value={judokaSeleccionado}
            onChange={(_, value) => setJudokaSeleccionado(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Escribir nombre, apellido o CI…"
                aria-label="Buscar judoka por nombre o CI"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText="Sin judokas encontrados"
            loadingText="Cargando judokas…"
            isOptionEqualToValue={(a, b) => a.id === b.id}
            clearOnEscape
            fullWidth
          />
        </Box>

        {/* ── Filtro de fechas ── */}
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, mb: 4, bgcolor: 'background.paper' }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5} flexWrap="wrap">
            <CalendarMonthIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="600">
              Período de consulta
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (opcional)
            </Typography>
            {hayFiltroFechas && (
              <Chip
                label="Limpiar fechas"
                size="small"
                icon={<ClearIcon />}
                onClick={() => { 
                  setFechaInicio(''); 
                  setFechaFin('');
                }}
                variant="outlined"
                clickable
                sx={{ cursor: 'pointer', ml: 'auto !important' }}
              />
            )}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <FormDatePicker
              name="fecha_inicio"
              control={control}
              label="Desde"
              maxDate={dayjs()}
              onChangeCustom={(val) => setFechaInicio(val || '')}
            />
            <FormDatePicker
              name="fecha_fin"
              control={control}
              label="Hasta"
              maxDate={dayjs()}
              onChangeCustom={(val) => setFechaFin(val || '')}
            />
          </Box>
        </Paper>

        {/* ── Estado vacío ── */}
        {!judokaSeleccionado && (
          <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
            <ManageSearchIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" gutterBottom fontWeight="500">
              Busca un judoka para comenzar
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Escribe su nombre, apellido o CI en el buscador de arriba.
            </Typography>
          </Box>
        )}

        {/* ── Resultado ── */}
        {judokaSeleccionado && (
          <>
            {/* Banner del judoka seleccionado */}
            <JudokaInfoBanner judoka={judokaSeleccionado} />

            {statsQuery.error || historialQuery.error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {statsQuery.error?.message ??
                  historialQuery.error?.message ??
                  'Error al cargar los datos.'}
              </Alert>
            ) : isLoadingData ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={180} />)}
              </Box>
            ) : stats && stats.total_sesiones > 0 ? (
              <>
                {/* KPIs */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
                  <KpiCard
                    label="% Asistencia"
                    value={stats.porcentaje}
                    color={getColorByPct(stats.porcentaje)}
                    subtitle={
                      hayFiltroFechas
                        ? `${fechaInicio ? dayjs(fechaInicio).format('D MMM') : '—'} → ${fechaFin ? dayjs(fechaFin).format('D MMM YYYY') : 'hoy'}`
                        : 'Todos los registros'
                    }
                  />
                  <KpiCard
                    label="Total sesiones"
                    value={stats.total_sesiones}
                    isPercentage={false}
                    color="primary"
                    secondaryStats={[
                      { label: 'Presentes', value: stats.presentes },
                      { label: 'Ausentes', value: stats.ausentes },
                    ]}
                  />
                  <KpiCard
                    label="Sesiones presentes"
                    value={stats.presentes}
                    isPercentage={false}
                    color={
                      stats.presentes === stats.total_sesiones && stats.total_sesiones > 0
                        ? 'success'
                        : 'default'
                    }
                    subtitle={`de ${stats.total_sesiones} sesiones`}
                  />
                </Box>

                {/* Resumen comisión */}
                <Box mb={4}>
                  <ResumenComision
                    stats={stats}
                    judoka={judokaSeleccionado}
                    periodo={periodo}
                  />
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" fontWeight="600" mb={2}>
                  Historial detallado de sesiones
                </Typography>
                <HistorialTable historial={historial} />
              </>
            ) : (
              <Alert severity="info">
                {hayFiltroFechas
                  ? 'Sin registros de asistencia en el período seleccionado para este judoka.'
                  : 'Este judoka no tiene sesiones de asistencia registradas.'}
              </Alert>
            )}
          </>
        )}
      </Box>
    </ProtectedRoute>
  )
}
