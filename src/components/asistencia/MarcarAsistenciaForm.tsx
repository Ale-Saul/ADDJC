'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Stack,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Divider,
  Avatar,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
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
      if (actual === 'presente') return { ...prev, [judokaId]: 'ausente' }
      return { ...prev, [judokaId]: 'presente' }
    })
  }

  const marcarTodos = (estado: EstadoAsistencia) => {
    const nuevo: EstadoLocal = {}
    judokas.forEach(j => { nuevo[j.id] = estado })
    setEstados(nuevo)
  }

  const presentes = Object.values(estados).filter(e => e === 'presente').length
  const ausentes = Object.values(estados).filter(e => e === 'ausente').length
  const sinMarcar = judokas.length - presentes - ausentes

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
      setError('Debes marcar al menos un judoka antes de guardar.')
      return
    }

    const res = await onGuardar(asistencias)
    if (!res.success) {
      setError(res.error || 'Error al guardar la asistencia.')
    }
  }

  const getInitials = (j: Judoka) =>
    `${j.nombres.charAt(0)}${j.apellidos.charAt(0)}`.toUpperCase()

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} role="alert">
          {error}
        </Alert>
      )}

      {/* Resumen */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip
          label={`${presentes} presentes`}
          color="success"
          size="small"
          variant={presentes > 0 ? 'filled' : 'outlined'}
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
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<CheckIcon />}
          onClick={() => marcarTodos('presente')}
          sx={{ minHeight: '44px' }}
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
          sx={{ minHeight: '44px' }}
          aria-label="Marcar todos como ausentes"
        >
          Todos ausentes
        </Button>
      </Stack>

      {/* Buscador */}
      <TextField
        size="small"
        placeholder="Buscar judoka…"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        aria-label="Buscar judoka en la lista"
      />

      <Divider />

      {/* Lista */}
      {judokasFiltrados.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No se encontraron judokas.
        </Typography>
      ) : (
        <List disablePadding>
          {judokasFiltrados.map((judoka, idx) => {
            const estado = estados[judoka.id]
            const esPresente = estado === 'presente'
            const esAusente = estado === 'ausente'

            return (
              <Box key={judoka.id}>
                <ListItem
                  sx={{
                    borderRadius: 1.5,
                    transition: 'background-color 150ms ease',
                    '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' },
                    py: 1,
                  }}
                  onClick={() => toggleEstado(judoka.id)}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      mr: 1.5,
                      fontSize: '0.8rem',
                      bgcolor: esPresente ? 'success.light' : esAusente ? 'error.light' : 'grey.300',
                      color: esPresente ? 'success.dark' : esAusente ? 'error.dark' : 'text.secondary',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(judoka)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight="500">
                        {judoka.apellidos}, {judoka.nombres}
                      </Typography>
                    }
                    secondary={
                      judoka.cinturon_actual
                        ? <Typography variant="caption" color="text.secondary">{judoka.cinturon_actual}</Typography>
                        : undefined
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={esPresente ? 'Presente' : esAusente ? 'Ausente' : 'Sin marcar'}
                      color={esPresente ? 'success' : esAusente ? 'error' : 'default'}
                      size="small"
                      variant={estado ? 'filled' : 'outlined'}
                      onClick={() => toggleEstado(judoka.id)}
                      clickable
                      sx={{ minWidth: '90px', cursor: 'pointer' }}
                      aria-label={`Estado de ${judoka.nombres}: ${estado ?? 'sin marcar'}. Clic para cambiar.`}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {idx < judokasFiltrados.length - 1 && <Divider component="li" />}
              </Box>
            )
          })}
        </List>
      )}

      {/* Guardar */}
      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', pt: 2, pb: 1 }}>
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
