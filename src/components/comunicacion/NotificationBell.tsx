'use client'

import { useState, useRef } from 'react'
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import PaymentIcon from '@mui/icons-material/Payment'
import SchoolIcon from '@mui/icons-material/School'
import ChecklistIcon from '@mui/icons-material/Checklist'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import InfoIcon from '@mui/icons-material/Info'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import { useRouter } from 'next/navigation'
import {
  useContadorNotificaciones,
  useNotificacionesByUsuario,
  useMarcarComoLeida,
  useMarcarTodasLeidas,
} from '@/hooks/useNotificaciones'
import type { Notificacion, ComunicacionNotifTipo } from '@/models/comunicacion'
import { NOTIF_TIPO_COLOR } from '@/constants/comunicacion'
import { formatters } from '@/utils/formatters'

const NOTIF_TIPO_ICON: Record<ComunicacionNotifTipo, React.ReactNode> = {
  pago: <PaymentIcon fontSize="small" />,
  examen: <SchoolIcon fontSize="small" />,
  asistencia: <ChecklistIcon fontSize="small" />,
  logro: <EmojiEventsIcon fontSize="small" />,
  info: <InfoIcon fontSize="small" />,
}

interface Props {
  usuarioId: string
}

export default function NotificationBell({ usuarioId }: Props) {
  const router = useRouter()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const { data: contador } = useContadorNotificaciones(usuarioId)
  const { data: notificaciones = [], isLoading } = useNotificacionesByUsuario(usuarioId)
  const marcarLeida = useMarcarComoLeida(usuarioId)
  const marcarTodas = useMarcarTodasLeidas(usuarioId)

  const noLeidas = contador?.total_no_leidas ?? 0
  const hayAltaPrioridad = contador?.tiene_alta_prioridad ?? false
  const recientes = notificaciones.slice(0, 6)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleClickNotif = (notif: Notificacion) => {
    if (!notif.leido && notif.prioridad !== 'alta') {
      marcarLeida.mutate({ id: notif.id, prioridad: notif.prioridad })
    }
    if (notif.link_accion) {
      router.push(notif.link_accion)
      handleClose()
    }
  }

  const handleVerTodas = () => {
    router.push('/comunicacion/notificaciones')
    handleClose()
  }

  const handleMarcarTodas = () => {
    marcarTodas.mutate()
  }

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          ref={anchorRef}
          onClick={handleOpen}
          size="medium"
          aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ''}`}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <Badge
            badgeContent={noLeidas > 9 ? '9+' : noLeidas}
            color={hayAltaPrioridad ? 'error' : 'primary'}
            invisible={noLeidas === 0}
          >
            {noLeidas > 0
              ? <NotificationsIcon />
              : <NotificationsNoneIcon />
            }
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxHeight: 500, display: 'flex', flexDirection: 'column' }
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          px: 2, py: 1.5, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider',
          flexShrink: 0,
        }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notificaciones
            {noLeidas > 0 && (
              <Chip
                label={noLeidas}
                size="small"
                color={hayAltaPrioridad ? 'error' : 'primary'}
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Typography>
          {noLeidas > 0 && (
            <Tooltip title="Marcar todas como leídas">
              <IconButton
                size="small"
                onClick={handleMarcarTodas}
                disabled={marcarTodas.isPending}
                aria-label="Marcar todas como leídas"
                sx={{ minWidth: 32, minHeight: 32 }}
              >
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Lista */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : recientes.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <NotificationsNoneIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Sin notificaciones
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {recientes.map((notif, idx) => (
                <Box key={notif.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    onClick={() => handleClickNotif(notif)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      cursor: notif.link_accion ? 'pointer' : 'default',
                      transition: 'background-color 150ms ease',
                      backgroundColor: notif.leido ? 'transparent' : 'action.hover',
                      '&:hover': { backgroundColor: 'action.selected' },
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        mt: 0.25,
                        color: `${NOTIF_TIPO_COLOR[notif.tipo]}.main`,
                      }}
                    >
                      {NOTIF_TIPO_ICON[notif.tipo]}
                    </ListItemIcon>
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={notif.leido ? 400 : 600}
                          sx={{ lineHeight: 1.4 }}
                        >
                          {notif.titulo}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          <Typography component="span" variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                            {notif.mensaje}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                            {formatters.formatDate(notif.created_at, 'long')}
                          </Typography>
                        </Box>
                      }
                    />
                    {!notif.leido && (
                      <Box
                        sx={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, mt: 0.75, ml: 1,
                          backgroundColor: notif.prioridad === 'alta' ? 'error.main' : 'primary.main',
                        }}
                      />
                    )}
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 1, flexShrink: 0 }}>
          <Button fullWidth size="small" onClick={handleVerTodas}>
            Ver todas las notificaciones
          </Button>
        </Box>
      </Popover>
    </>
  )
}
