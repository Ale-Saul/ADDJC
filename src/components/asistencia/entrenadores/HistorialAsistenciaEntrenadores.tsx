'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import RefreshIcon from '@mui/icons-material/Refresh'
import { AsistenciaEntrenador } from '@/models/asistenciaEntrenador'
import { asistenciaEntrenadorService } from '@/services/asistenciaEntrenadorService'
import { CATEGORIES } from '@/constants/globales'
import { getGoogleMapsUrl, formatAccuracy } from '@/utils/geolocation'
import dayjs from 'dayjs'

interface Props {
  clubId?: string
  entrenadorId?: string
  mostrarFiltroEntrenador?: boolean
  entrenadoresDisponibles?: Array<{ id: string; nombre: string }>
}

export default function HistorialAsistenciaEntrenadores({
  clubId,
  entrenadorId: fixedEntrenadorId,
  mostrarFiltroEntrenador = true,
  entrenadoresDisponibles = [],
}: Props) {
  const [registros, setRegistros] = useState<AsistenciaEntrenador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState<string>('all')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('all')
  const [entrenadorFiltro, setEntrenadorFiltro] = useState<string>(fixedEntrenadorId || 'all')
  const [fechaInicio, setFechaInicio] = useState<string>(dayjs().subtract(1, 'month').format('YYYY-MM-DD'))
  const [fechaFin, setFechaFin] = useState<string>(dayjs().format('YYYY-MM-DD'))

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await asistenciaEntrenadorService.getHistorial({
      clubId: clubId || undefined,
      entrenadorId: fixedEntrenadorId || (entrenadorFiltro !== 'all' ? entrenadorFiltro : undefined),
      tipoEvento: tipoFiltro !== 'all' ? tipoFiltro : undefined,
      categoria: categoriaFiltro !== 'all' ? categoriaFiltro : undefined,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    })

    if (res.success && res.data) {
      setRegistros(res.data)
    } else {
      setError(res.error || 'Error al cargar registros')
    }
    setLoading(false)
  }, [clubId, fixedEntrenadorId, entrenadorFiltro, tipoFiltro, categoriaFiltro, fechaInicio, fechaFin])

  useEffect(() => {
    cargar()
  }, [cargar])

  const calcularDuracion = (inicio: string, fin?: string | null) => {
    if (!fin) return 'En curso'
    const diff = dayjs(fin).diff(dayjs(inicio), 'minute')
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return h > 0 ? `${h}h ${m}m` : `${m} min`
  }

  return (
    <Stack spacing={2.5}>
      {/* Barra de Filtros */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          {mostrarFiltroEntrenador && !fixedEntrenadorId && entrenadoresDisponibles.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="ent-filter">Entrenador</InputLabel>
              <Select
                labelId="ent-filter"
                label="Entrenador"
                value={entrenadorFiltro}
                onChange={(e) => setEntrenadorFiltro(e.target.value)}
              >
                <MenuItem value="all">Todos los entrenadores</MenuItem>
                {entrenadoresDisponibles.map((ent) => (
                  <MenuItem key={ent.id} value={ent.id}>
                    {ent.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="tipo-filter">Tipo de Actividad</InputLabel>
            <Select
              labelId="tipo-filter"
              label="Tipo de Actividad"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              <MenuItem value="all">Todos los tipos</MenuItem>
              <MenuItem value="entrenamiento">Entrenamientos</MenuItem>
              <MenuItem value="partido">Partidos</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="cat-filter">Categoría</InputLabel>
            <Select
              labelId="cat-filter"
              label="Categoría"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <MenuItem value="all">Todas las categorías</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="Desde"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => cargar()}
            disabled={loading}
            sx={{ ml: 'auto' }}
          >
            Actualizar
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Tabla de Registros */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Fecha & Actividad</TableCell>
              {mostrarFiltroEntrenador && !fixedEntrenadorId && (
                <TableCell sx={{ fontWeight: 'bold' }}>Entrenador</TableCell>
              )}
              <TableCell sx={{ fontWeight: 'bold' }}>Horarios & Duración</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Constancia GPS (Ubicación)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Observaciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Cargando asistencias de entrenadores...
                </TableCell>
              </TableRow>
            ) : registros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No se encontraron marcaciones para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              registros.map((r) => {
                const esPartido = r.tipo_evento === 'partido'
                const horaEntradaStr = dayjs(r.hora_entrada).format('HH:mm')
                const horaSalidaStr = r.hora_salida ? dayjs(r.hora_salida).format('HH:mm') : '—'
                const duracion = calcularDuracion(r.hora_entrada, r.hora_salida)

                return (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="600">
                          {dayjs(r.fecha).format('DD/MM/YYYY')}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                          <Chip
                            size="small"
                            icon={esPartido ? <EmojiEventsIcon sx={{ fontSize: '13px !important' }} /> : <SportsSoccerIcon sx={{ fontSize: '13px !important' }} />}
                            label={esPartido ? 'Partido' : 'Entrenamiento'}
                            color={esPartido ? 'secondary' : 'primary'}
                            variant="outlined"
                            sx={{ fontSize: '0.68rem', height: 20 }}
                          />
                          {r.categoria && (
                            <Chip
                              size="small"
                              label={r.categoria}
                              sx={{ fontSize: '0.68rem', height: 20 }}
                            />
                          )}
                        </Stack>
                        {r.titulo && (
                          <Typography variant="caption" color="text.secondary">
                            {r.titulo}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    {mostrarFiltroEntrenador && !fixedEntrenadorId && (
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {r.nombre_entrenador} {r.apellido_entrenador}
                        </Typography>
                        {r.nombre_club && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {r.nombre_club}
                          </Typography>
                        )}
                      </TableCell>
                    )}

                    <TableCell>
                      <Typography variant="body2">
                        {horaEntradaStr} → {horaSalidaStr}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Duración: <strong>{duracion}</strong>
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        {/* Entrada GPS */}
                        {r.latitud_entrada && r.longitud_entrada ? (
                          <Tooltip title={`Precisión: ${formatAccuracy(r.precision_entrada)}`}>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<LocationOnIcon sx={{ fontSize: 14, color: 'success.main' }} />}
                              endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                              href={getGoogleMapsUrl(r.latitud_entrada, r.longitud_entrada)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.72rem',
                                p: 0,
                                justifyContent: 'flex-start',
                                color: 'primary.main',
                              }}
                            >
                              Entrada: Mapa
                            </Button>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            Entrada sin GPS
                          </Typography>
                        )}

                        {/* Salida GPS */}
                        {r.latitud_salida && r.longitud_salida ? (
                          <Tooltip title={`Precisión: ${formatAccuracy(r.precision_salida)}`}>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<LocationOnIcon sx={{ fontSize: 14, color: 'error.main' }} />}
                              endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                              href={getGoogleMapsUrl(r.latitud_salida, r.longitud_salida)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.72rem',
                                p: 0,
                                justifyContent: 'flex-start',
                                color: 'primary.main',
                              }}
                            >
                              Salida: Mapa
                            </Button>
                          </Tooltip>
                        ) : r.estado === 'completado' ? (
                          <Typography variant="caption" color="text.disabled">
                            Salida sin GPS
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {r.estado === 'en_curso' ? (
                        <Chip
                          label="En curso"
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      ) : (
                        <Chip
                          label="Completado"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      )}
                    </TableCell>

                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="caption" color="text.secondary">
                        {r.notas || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}

