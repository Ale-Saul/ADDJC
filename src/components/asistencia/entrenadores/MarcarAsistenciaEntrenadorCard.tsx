'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Box,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { CATEGORIES } from '@/constants/globales'
import { senseiController } from '@/controllers/senseiController'
import { useEffect } from 'react'
import { TipoEventoEntrenador } from '@/models/asistenciaEntrenador'
import { useCheckinEntrenador } from '@/hooks/useAsistenciaEntrenador'
import { getGoogleMapsUrl, formatAccuracy } from '@/utils/geolocation'
import dayjs from 'dayjs'

interface Props {
  entrenadorId: string
  clubId: string
  onRegistroExitoso?: () => void
}

export default function MarcarAsistenciaEntrenadorCard({
  entrenadorId,
  clubId,
  onRegistroExitoso,
}: Props) {
  const {
    activa,
    loading,
    gpsLoading,
    error,
    duracionMinutos,
    marcarEntrada,
    marcarSalida,
  } = useCheckinEntrenador(entrenadorId, clubId)

  // Form local para entrada
  const [tipoEvento, setTipoEvento] = useState<TipoEventoEntrenador>('entrenamiento')
  const [categoria, setCategoria] = useState<string>('')
  const [categoriasEntrenador, setCategoriasEntrenador] = useState<string[]>([])

  useEffect(() => {
    if (!entrenadorId) return
    let cancelled = false
    const loadCats = async () => {
      const res = await senseiController.getSenseiById(entrenadorId)
      if (cancelled) return
      if (res.success && res.data) {
        const cats = Array.isArray(res.data.categorias) && res.data.categorias.length > 0
          ? res.data.categorias
          : []
        setCategoriasEntrenador(cats)
        if (cats.length === 1) {
          setCategoria(cats[0])
        }
      }
    }
    void loadCats()
    return () => {
      cancelled = true
    }
  }, [entrenadorId])
  const [titulo, setTitulo] = useState<string>('')
  const [notasSalida, setNotasSalida] = useState<string>('')
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const handleEntrada = async () => {
    setMensajeExito(null)
    const res = await marcarEntrada({
      tipo_evento: tipoEvento,
      categoria: categoria || null,
      titulo: titulo.trim() || null,
    })

    if (res.success) {
      setTitulo('')
      setMensajeExito('¡Entrada registrada con éxito con constancia de ubicación!')
      if (onRegistroExitoso) onRegistroExitoso()
    }
  }

  const handleSalida = async () => {
    setMensajeExito(null)
    const res = await marcarSalida(notasSalida.trim() || undefined)
    if (res.success) {
      setNotasSalida('')
      setMensajeExito('¡Salida registrada con éxito! Tu jornada ha quedado completada.')
      if (onRegistroExitoso) onRegistroExitoso()
    }
  }

  const horas = Math.floor(duracionMinutos / 60)
  const mins = duracionMinutos % 60
  const textoDuracion = horas > 0 ? `${horas}h ${mins}m` : `${mins} min`

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: activa ? 'success.main' : 'divider',
        borderWidth: activa ? 2 : 1,
        bgcolor: activa ? 'rgba(46, 125, 50, 0.03)' : 'background.paper',
        boxShadow: activa ? '0 4px 20px rgba(46, 125, 50, 0.12)' : 'none',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Cabecera */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: activa ? 'success.main' : 'primary.main',
                color: 'white',
              }}
            >
              {activa ? (
                <AccessTimeIcon fontSize="medium" />
              ) : (
                <LocationOnIcon fontSize="medium" />
              )}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {activa ? 'Actividad en Curso' : 'Control de Asistencia del Entrenador'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activa
                  ? 'Tienes una jornada abierta. Marca tu salida al finalizar.'
                  : 'Registra tu entrada y salida con constancia GPS para el club.'}
              </Typography>
            </Box>
          </Stack>

          {activa && (
            <Chip
              label="EN CURSO"
              color="success"
              sx={{ fontWeight: 'bold', animation: 'pulse 2s infinite' }}
            />
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {mensajeExito && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensajeExito(null)}>
            {mensajeExito}
          </Alert>
        )}

        {/* ── Vista 1: SESIÓN EN CURSO (Marcar Salida) ── */}
        {activa ? (
          <Stack spacing={2.5}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                    <Chip
                      icon={activa.tipo_evento === 'partido' ? <EmojiEventsIcon /> : <SportsSoccerIcon />}
                      label={activa.tipo_evento === 'partido' ? 'Partido' : 'Entrenamiento'}
                      color={activa.tipo_evento === 'partido' ? 'secondary' : 'primary'}
                      size="small"
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />
                    {activa.categoria && (
                      <Chip label={activa.categoria} size="small" variant="outlined" />
                    )}
                  </Stack>
                  <Typography variant="subtitle1" fontWeight="600">
                    {activa.titulo || (activa.tipo_evento === 'partido' ? 'Partido oficial / amistoso' : 'Sesión de entrenamiento')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Iniciado hoy a las {dayjs(activa.hora_entrada).format('HH:mm')}
                  </Typography>
                </Box>

                <Box textAlign={{ xs: 'left', sm: 'right' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Tiempo transcurrido:
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {textoDuracion}
                  </Typography>
                </Box>
              </Stack>

              {/* Constancia de GPS al entrar */}
              {activa.latitud_entrada && activa.longitud_entrada && (
                <Box mt={1.5} pt={1.5} sx={{ borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      📍 Ubicación de entrada registrada {formatAccuracy(activa.precision_entrada)}:
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                      href={getGoogleMapsUrl(activa.latitud_entrada, activa.longitud_entrada)}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ py: 0.2, px: 1, fontSize: '0.72rem', textTransform: 'none' }}
                    >
                      Ver en Google Maps
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>

            <TextField
              label="Observaciones o novedades del entrenamiento/partido (opcional)"
              placeholder="Ej: Se entrenó táctica fija, ningún jugador con molestias..."
              value={notasSalida}
              onChange={(e) => setNotasSalida(e.target.value)}
              multiline
              rows={2}
              size="small"
              fullWidth
            />

            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              startIcon={gpsLoading || loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              onClick={handleSalida}
              disabled={loading || gpsLoading}
              sx={{ minHeight: 48, fontWeight: 'bold' }}
            >
              {gpsLoading
                ? 'Obteniendo GPS...'
                : loading
                ? 'Registrando salida...'
                : 'Marcar Salida (Finalizar con GPS)'}
            </Button>
          </Stack>
        ) : (
          /* ── Vista 2: SIN SESIÓN ACTIVA (Marcar Entrada) ── */
          <Stack spacing={2}>
            {/* Selector de Tipo: Entrenamiento o Partido */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Tipo de actividad:
              </Typography>
              <ToggleButtonGroup
                value={tipoEvento}
                exclusive
                onChange={(_, val) => val && setTipoEvento(val)}
                fullWidth
                size="small"
              >
                <ToggleButton value="entrenamiento" sx={{ py: 1 }}>
                  <SportsSoccerIcon sx={{ mr: 1, fontSize: 18 }} />
                  Entrenamiento
                </ToggleButton>
                <ToggleButton value="partido" sx={{ py: 1 }}>
                  <EmojiEventsIcon sx={{ mr: 1, fontSize: 18 }} />
                  Partido
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Categoría y Título/Lugar */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="cat-label">Categoría</InputLabel>
                <Select
                  labelId="cat-label"
                  label="Categoría"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{categoriasEntrenador.length > 0 ? 'Selecciona una categoría' : 'Todas / General'}</em>
                  </MenuItem>
                  {(categoriasEntrenador.length > 0 ? categoriasEntrenador : CATEGORIES).map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label={tipoEvento === 'partido' ? 'Rival / Cancha (opcional)' : 'Lugar / Tema (opcional)'}
                placeholder={tipoEvento === 'partido' ? 'Ej: vs Wilstermann - Cancha 1' : 'Ej: Cancha Sintética B'}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </Stack>

            <Divider />

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={gpsLoading || loading ? <CircularProgress size={20} color="inherit" /> : <LocationOnIcon />}
              onClick={handleEntrada}
              disabled={loading || gpsLoading}
              sx={{ minHeight: 48, fontWeight: 'bold' }}
            >
              {gpsLoading
                ? 'Obteniendo ubicación GPS...'
                : loading
                ? 'Registrando...'
                : `Marcar Entrada de ${tipoEvento === 'partido' ? 'Partido' : 'Entrenamiento'} (Check-In GPS)`}
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
              ℹ️ Tu navegador solicitará permiso de ubicación para guardar las coordenadas como constancia.
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

