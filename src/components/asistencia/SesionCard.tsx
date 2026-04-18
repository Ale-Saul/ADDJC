'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material'
import ChecklistIcon from '@mui/icons-material/Checklist'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { AsistenciaSesion } from '@/models/asistencia'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

interface Props {
  sesion: AsistenciaSesion
  mostrarSensei: boolean
  onEliminar: (id: string) => Promise<{ success: boolean; error?: string }>
  eliminarLoading: boolean
}

export default function SesionCard({ sesion, mostrarSensei, onEliminar, eliminarLoading }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fechaFormateada = dayjs(sesion.fecha).format('dddd D [de] MMMM YYYY')

  const handleTomarLista = () => {
    router.push(`/asistencia/${sesion.id}`)
  }

  const handleEliminar = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    const res = await onEliminar(sesion.id)
    if (!res.success) setConfirmDelete(false)
  }

  const presentes = sesion.total_presentes ?? 0
  const total = sesion.total_judokas ?? 0
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : null

  const colorPorcentaje = porcentaje === null
    ? 'default'
    : porcentaje >= 80 ? 'success'
    : porcentaje >= 50 ? 'warning'
    : 'error'

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main',
        },
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        <Stack spacing={1}>
          {/* Fecha y título */}
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {fechaFormateada}
            </Typography>
          </Stack>

          {sesion.titulo && (
            <Typography variant="h6" fontWeight="600" lineHeight={1.3}>
              {sesion.titulo}
            </Typography>
          )}

          {/* Sensei (solo encargado/admin) */}
          {mostrarSensei && sesion.nombre_sensei && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {sesion.nombre_sensei}
              </Typography>
            </Stack>
          )}

          {/* Horario */}
          {sesion.hora_inicio && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {sesion.hora_inicio}{sesion.hora_fin ? ` – ${sesion.hora_fin}` : ''}
              </Typography>
            </Stack>
          )}

          {/* Stats chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: 0.5 }}>
            {porcentaje !== null && (
              <Chip
                label={`${presentes}/${total} presentes (${porcentaje}%)`}
                color={colorPorcentaje as 'default' | 'success' | 'warning' | 'error'}
                size="small"
                variant="outlined"
              />
            )}
            {porcentaje === null && (
              <Chip label="Sin lista aún" size="small" variant="outlined" color="default" />
            )}
          </Stack>

          {/* Notas colapsables */}
          {sesion.notas && (
            <>
              <Box>
                <Collapse in={expanded}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {sesion.notas}
                  </Typography>
                </Collapse>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5, pt: 1 }}>
        <Stack direction="row" spacing={0.5}>
          {/* Botón expandir notas */}
          {sesion.notas && (
            <Tooltip title={expanded ? 'Ocultar notas' : 'Ver notas'}>
              <IconButton
                size="small"
                onClick={() => setExpanded(v => !v)}
                aria-label={expanded ? 'Ocultar notas' : 'Ver notas'}
                sx={{ minWidth: '44px', minHeight: '44px' }}
              >
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          {/* Eliminar */}
          <Tooltip title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar sesión'}>
            <span>
              <IconButton
                size="small"
                color={confirmDelete ? 'error' : 'default'}
                onClick={handleEliminar}
                disabled={eliminarLoading}
                aria-label={confirmDelete ? 'Confirmar eliminación de sesión' : 'Eliminar sesión'}
                sx={{ minWidth: '44px', minHeight: '44px' }}
                onBlur={() => setConfirmDelete(false)}
              >
                {eliminarLoading
                  ? <CircularProgress size={16} />
                  : <DeleteOutlineIcon fontSize="small" />
                }
              </IconButton>
            </span>
          </Tooltip>

          {/* Tomar lista */}
          <Tooltip title="Tomar lista">
            <IconButton
              size="small"
              color="primary"
              onClick={handleTomarLista}
              aria-label="Tomar lista de asistencia"
              sx={{ minWidth: '44px', minHeight: '44px' }}
            >
              <ChecklistIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  )
}
