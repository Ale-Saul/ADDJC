'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Stack,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Divider,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EventNoteIcon from '@mui/icons-material/EventNote'
import { Judoka } from '@/models/judoka'
import { AsistenciaDetalle, AsistenciaDetalleUpsert, EstadoAsistencia } from '@/models/asistencia'

interface Props {
  sesionId: string
  marcadoPor: string
  judokas: Judoka[]
  detalleExistente: AsistenciaDetalle[]
  onGuardar: (asistencias: AsistenciaDetalleUpsert[]) => Promise<{ success: boolean; error?: string }>
  guardandoLoading: boolean
}

type EstadoLocal = Record<string, EstadoAsistencia>

export default function MarcarAsistenciaForm({
  sesionId,
  marcadoPor,
  judokas,
  detalleExistente,
  onGuardar,
  guardandoLoading,
}: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [estados, setEstados] = useState<EstadoLocal>({})
  const [error, setError] = useState<string | null>(null)

  // Inicializa con el detalle ya existente en la bd
  useEffect(() => {
    const inicial: EstadoLocal = {}
    detalleExistente.forEach(d => {
      inicial[d.judoka_id] = d.estado
    })
    setEstados(inicial)
  }, [detalleExistente])

  const judokasFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return judokas
    return judokas.filter(j =>
      `${j.nombres} ${j.apellidos}`.toLowerCase().includes(q) ||
      j.ci?.toLowerCase().includes(q)
    )
  }, [judokas, busqueda])

  const toggleEstado = (judokaId: string) => {
    setEstados(prev => {
      const actual = prev[judokaId]
      if (!actual) return { ...prev, [judokaId]: 'presente' }
      if (actual === 'presente') return { ...prev, [judokaId]: 'tarde' }
      if (actual === 'tarde') return { ...prev, [judokaId]: 'permiso' }
      if (actual === 'permiso') return { ...prev, [judokaId]: 'ausente' }
      return { ...prev, [judokaId]: 'presente' }
    })
  }

  const handleCambioEstado = (judokaId: string, nuevoEstado: EstadoAsistencia | null) => {
    if (nuevoEstado) {
      setEstados(prev => ({ ...prev, [judokaId]: nuevoEstado }))
    } else {
      setEstados(prev => {
        const copy = { ...prev }
        delete copy[judokaId]
        return copy
      })
    }
  }

  const marcarTodos = (estado: EstadoAsistencia) => {
    const nuevo: EstadoLocal = {}
    judokas.forEach(j => { nuevo[j.id] = estado })
    setEstados(nuevo)
  }

  const presentes = Object.values(estados).filter(e => e === 'presente').length
  const tardes = Object.values(estados).filter(e => e === 'tarde').length
  const permisos = Object.values(estados).filter(e => e === 'permiso').length
  const ausentes = Object.values(estados).filter(e => e === 'ausente').length
  const sinMarcar = judokas.length - presentes - tardes - permisos - ausentes

  const handleGuardar = async () => {
    setError(null)
    const asistencias: AsistenciaDetalleUpsert[] = judokas
      .filter(j => estados[j.id] !== undefined)
      .map(j => ({
        sesion_id: sesionId,
        judoka_id: j.id,
        estado: estados[j.id],
        marcado_por: marcadoPor,
        marcado_at: new Date().toISOString(),
      }))

    if (asistencias.length === 0) {
      setError('Debes marcar al menos un futbolista antes de guardar.')
      return
    }

    const res = await onGuardar(asistencias)
    if (!res.success) {
      setError(res.error || 'Error al guardar la asistencia.')
    }
  }

  const getInitials = (j: Judoka) =>
    `${j.nombres.charAt(0)}${j.apellidos.charAt(0)}`.toUpperCase()

  const getAvatarBg = (estado?: EstadoAsistencia) => {
    switch (estado) {
      case 'presente':
        return 'success.light'
      case 'tarde':
        return 'warning.light'
      case 'permiso':
        return 'info.light'
      case 'ausente':
        return 'error.light'
      default:
        return 'grey.300'
    }
  }

  const getAvatarColor = (estado?: EstadoAsistencia) => {
    switch (estado) {
      case 'presente':
        return 'success.dark'
      case 'tarde':
        return 'warning.dark'
      case 'permiso':
        return 'info.dark'
      case 'ausente':
        return 'error.dark'
      default:
        return 'text.secondary'
    }
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} role="alert">
          {error}
        </Alert>
      )}

      {/* Resumen */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          label={`${presentes} presentes`}
          color="success"
          size="small"
          variant={presentes > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          label={`${tardes} tarde`}
          color="warning"
          size="small"
          variant={tardes > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          label={`${permisos} permisos`}
          color="info"
          size="small"
          variant={permisos > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          label={`${ausentes} ausentes`}
          color="error"
          size="small"
          variant={ausentes > 0 ? 'filled' : 'outlined'}
        />
        {sinMarcar > 0 && (
          <Chip label={`${sinMarcar} sin marcar`} color="default" size="small" variant="outlined" />
        )}
      </Stack>

      {/* Acciones masivas */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<CheckIcon />}
          onClick={() => marcarTodos('presente')}
          sx={{ minHeight: '40px' }}
          aria-label="Marcar todos como presentes"
        >
          Todos presentes
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<CloseIcon />}
          onClick={() => marcarTodos('ausente')}
          sx={{ minHeight: '40px' }}
          aria-label="Marcar todos como ausentes"
        >
          Todos ausentes
        </Button>
      </Stack>

      {/* Buscador */}
      <TextField
        size="small"
        placeholder="Buscar futbolista…"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        aria-label="Buscar futbolista en la lista"
      />

      <Divider />

      {/* Lista */}
      {judokasFiltrados.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No se encontraron futbolistas.
        </Typography>
      ) : (
        <List disablePadding>
          {judokasFiltrados.map((judoka, idx) => {
            const estado = estados[judoka.id]

            return (
              <Box key={judoka.id}>
                <ListItem
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    px: { xs: 1, sm: 2 },
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 1.5,
                    transition: 'background-color 150ms ease',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {/* Info del futbolista */}
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', md: 'auto' }, cursor: 'pointer' }}
                    onClick={() => toggleEstado(judoka.id)}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        mr: 1.5,
                        fontSize: '0.8rem',
                        bgcolor: getAvatarBg(estado),
                        color: getAvatarColor(estado),
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(judoka)}
                    </Avatar>
                    <ListItemText
                      sx={{ my: 0 }}
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Typography variant="body2" fontWeight="600">
                            {judoka.apellidos}, {judoka.nombres}
                          </Typography>
                          {judoka.posicion && (
                            <Chip
                              label={judoka.posicion}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                          {judoka.categoria && (
                            <Chip
                              label={judoka.categoria}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        judoka.categoria_secundaria ? (
                          <Typography variant="caption" color="text.secondary">
                            2da Cat: {judoka.categoria_secundaria}
                          </Typography>
                        ) : undefined
                      }
                    />
                  </Box>

                  {/* Botones de acción directa: Presente, Tarde, Permiso, Ausente */}
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={estado ?? null}
                    onChange={(_, val) => handleCambioEstado(judoka.id, val)}
                    aria-label={`Asistencia de ${judoka.nombres} ${judoka.apellidos}`}
                    sx={{
                      alignSelf: { xs: 'stretch', md: 'center' },
                      display: 'flex',
                      '& .MuiToggleButton-root': {
                        flex: { xs: 1, md: 'initial' },
                        px: { xs: 1, sm: 1.5 },
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <ToggleButton
                      value="presente"
                      color="success"
                      aria-label="Presente"
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'success.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'success.dark' },
                        },
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 16, mr: { xs: 0.5, sm: 0.75 } }} />
                      Presente
                    </ToggleButton>

                    <ToggleButton
                      value="tarde"
                      color="warning"
                      aria-label="Tarde"
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'warning.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'warning.dark' },
                        },
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 16, mr: { xs: 0.5, sm: 0.75 } }} />
                      Tarde
                    </ToggleButton>

                    <ToggleButton
                      value="permiso"
                      color="info"
                      aria-label="Permiso"
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'info.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'info.dark' },
                        },
                      }}
                    >
                      <EventNoteIcon sx={{ fontSize: 16, mr: { xs: 0.5, sm: 0.75 } }} />
                      Permiso
                    </ToggleButton>

                    <ToggleButton
                      value="ausente"
                      color="error"
                      aria-label="Ausente"
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'error.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'error.dark' },
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16, mr: { xs: 0.5, sm: 0.75 } }} />
                      Ausente
                    </ToggleButton>
                  </ToggleButtonGroup>
                </ListItem>
                {idx < judokasFiltrados.length - 1 && <Divider component="li" />}
              </Box>
            )
          })}
        </List>
      )}

      {/* Guardar */}
      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', pt: 2, pb: 1, zIndex: 1 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleGuardar}
          disabled={guardandoLoading || judokas.length === 0}
          startIcon={guardandoLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ minHeight: '52px' }}
          aria-label="Guardar registro de asistencia"
        >
          {guardandoLoading ? 'Guardando…' : 'Guardar asistencia'}
        </Button>
      </Box>
    </Stack>
  )
}
