'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  Snackbar,
  Skeleton,
  Stack,
  Tooltip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import PaymentIcon from '@mui/icons-material/Payment'
import SchoolIcon from '@mui/icons-material/School'
import ChecklistIcon from '@mui/icons-material/Checklist'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import InfoIcon from '@mui/icons-material/Info'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import SendIcon from '@mui/icons-material/Send'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  useNotificacionesByUsuario,
  useMarcarComoLeida,
  useMarcarTodasLeidas,
} from '@/hooks/useNotificaciones'
import { PageHeader } from '@/components/ui/PageHeader'
import { NOTIF_TIPO_LABELS, NOTIF_TIPO_COLOR } from '@/constants/comunicacion'
import type { Notificacion, ComunicacionNotifTipo } from '@/models/comunicacion'
import { formatters } from '@/utils/formatters'
import Pagination from '@/components/common/Pagination'
import EnviarNotificacionManualForm from '@/components/comunicacion/EnviarNotificacionManualForm'
import { ROL } from '@/constants/roles'

function toYmd(iso: string): string {
  return iso.slice(0, 10)
}

function crearRangoNotificacionesDefault(): { desde: string; hasta: string } {
  const hoy = dayjs()
  return {
    desde: hoy.subtract(1, 'month').format('YYYY-MM-DD'),
    hasta: hoy.format('YYYY-MM-DD'),
  }
}

function notifEnRango(n: Notificacion, desde: string, hasta: string): boolean {
  const d = toYmd(n.created_at)
  return d >= desde && d <= hasta
}

const NOTIF_TIPO_ICON: Record<ComunicacionNotifTipo, React.ReactNode> = {
  pago: <PaymentIcon />,
  examen: <SchoolIcon />,
  asistencia: <ChecklistIcon />,
  logro: <EmojiEventsIcon />,
  info: <InfoIcon />,
}

export default function NotificacionesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const usuarioId = user?.id ?? ''

  const { data: notificaciones = [], isLoading } = useNotificacionesByUsuario(usuarioId)
  const marcarLeida = useMarcarComoLeida(usuarioId)
  const marcarTodas = useMarcarTodasLeidas(usuarioId)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [openEnviar, setOpenEnviar] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fechaDesde, setFechaDesde] = useState(() => crearRangoNotificacionesDefault().desde)
  const [fechaHasta, setFechaHasta] = useState(() => crearRangoNotificacionesDefault().hasta)
  
  const remitenteRol =
    user?.rol === ROL.ASOCIACION || user?.rol === ROL.ENCARGADO || user?.rol === ROL.SENSEI
      ? user.rol
      : null

  const hoy = dayjs()

  const notificacionesFiltradas = useMemo(
    () => notificaciones.filter(n => notifEnRango(n, fechaDesde, fechaHasta)),
    [notificaciones, fechaDesde, fechaHasta],
  )

  useEffect(() => {
    setPage(1)
  }, [fechaDesde, fechaHasta])

  const noLeidas = notificacionesFiltradas.filter(n => !n.leido).length
  const totalPages = Math.ceil(notificacionesFiltradas.length / itemsPerPage)
  const currentPage = Math.min(page, totalPages || 1)
  const notificacionesPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return notificacionesFiltradas.slice(start, start + itemsPerPage)
  }, [notificacionesFiltradas, currentPage, itemsPerPage])

  const handleClickNotif = (notif: Notificacion) => {
    if (!notif.leido && notif.prioridad !== 'alta') {
      marcarLeida.mutate({ id: notif.id, prioridad: notif.prioridad })
    }
    if (notif.link_accion) {
      router.push(notif.link_accion)
    }
  }

  return (
    <Box>
      <PageHeader
        title="Mis Notificaciones"
        actionLabel={remitenteRol ? 'Enviar notificación' : undefined}
        actionIcon={<SendIcon />}
        onAction={remitenteRol ? () => setOpenEnviar(true) : undefined}
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FilterListIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>
              Filtrar por fecha de la notificación
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
              onChange={(newValue) =>
                setFechaDesde(newValue ? newValue.format('YYYY-MM-DD') : crearRangoNotificacionesDefault().desde)
              }
              maxDate={fechaHasta ? dayjs(fechaHasta) : hoy}
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
              onChange={(newValue) =>
                setFechaHasta(
                  newValue ? newValue.format('YYYY-MM-DD') : crearRangoNotificacionesDefault().hasta,
                )
              }
              minDate={fechaDesde ? dayjs(fechaDesde) : undefined}
              maxDate={hoy}
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

      {/* Resumen */}
      {noLeidas > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Tienes <strong>{noLeidas}</strong> notificación{noLeidas !== 1 ? 'es' : ''} sin leer
          </Typography>
          <Tooltip title="Marcar todas como leídas">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={() => marcarTodas.mutate()}
              disabled={marcarTodas.isPending}
            >
              Marcar todas
            </Button>
          </Tooltip>
        </Stack>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        {isLoading ? (
          <List disablePadding>
            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i}>
                {i > 0 && <Divider />}
                <ListItem sx={{ py: 2, px: 2.5 }}>
                  <Skeleton variant="circular" width={36} height={36} sx={{ mr: 2, flexShrink: 0 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton width="60%" height={18} />
                    <Skeleton width="90%" height={14} sx={{ mt: 0.5 }} />
                    <Skeleton width="30%" height={12} sx={{ mt: 0.5 }} />
                  </Box>
                </ListItem>
              </Box>
            ))}
          </List>
        ) : notificaciones.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" color="text.secondary">
              No tienes notificaciones
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Aquí aparecerán tus alertas de pagos, exámenes y logros
            </Typography>
          </Box>
        ) : notificacionesFiltradas.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" color="text.secondary">
              Nada en este período
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Ampliá el rango de fechas para ver notificaciones anteriores
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notificacionesPaginadas.map((notif, idx) => (
              <Box key={notif.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  onClick={() => handleClickNotif(notif)}
                  sx={{
                    py: 2,
                    px: 2.5,
                    cursor: notif.link_accion ? 'pointer' : 'default',
                    transition: 'background-color 150ms ease',
                    backgroundColor: notif.leido ? 'transparent' : 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' },
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Ícono del tipo */}
                  <ListItemIcon
                    sx={{
                      minWidth: 44,
                      mt: 0.25,
                      color: `${NOTIF_TIPO_COLOR[notif.tipo]}.main`,
                    }}
                  >
                    {NOTIF_TIPO_ICON[notif.tipo]}
                  </ListItemIcon>

                  <ListItemText
                    disableTypography
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography
                          variant="body1"
                          fontWeight={notif.leido ? 400 : 600}
                          component="span"
                        >
                          {notif.titulo}
                        </Typography>
                        <Chip
                          label={NOTIF_TIPO_LABELS[notif.tipo]}
                          size="small"
                          color={NOTIF_TIPO_COLOR[notif.tipo]}
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                        {notif.prioridad === 'alta' && (
                          <Chip
                            label="Crítica"
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Box component="span" sx={{ mt: 0.5, display: 'block' }}>
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
                          {notif.mensaje}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                          {formatters.formatDate(notif.created_at, 'long')}
                          {notif.leido_at && ` · Leída el ${formatters.formatDate(notif.leido_at)}`}
                        </Typography>
                        {notif.link_accion && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="primary.main"
                            sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}
                          >
                            Ir a resolver →
                          </Typography>
                        )}
                      </Box>
                    }
                  />

                  {/* Indicador no leído */}
                  {!notif.leido && (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        flexShrink: 0,
                        mt: 1,
                        ml: 1,
                        backgroundColor: notif.prioridad === 'alta' ? 'error.main' : 'primary.main',
                      }}
                    />
                  )}
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {!isLoading && notificacionesFiltradas.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={notificacionesFiltradas.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[10, 20, 50]}
        />
      )}

      <Dialog
        open={openEnviar}
        onClose={() => setOpenEnviar(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Enviar notificación directa</DialogTitle>
        <DialogContent dividers>
          {user && remitenteRol && (
            <EnviarNotificacionManualForm
              remitenteId={user.id}
              remitenteRol={remitenteRol}
              remitenteClubId={user.club_id}
              remitenteSenseiId={user.sensei_id}
              onCancel={() => setOpenEnviar(false)}
              onSuccess={() => {
                setOpenEnviar(false)
                setSuccessMessage('Notificación enviada correctamente')
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3500}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
