'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Divider,
  Skeleton,
  Alert,
  Snackbar,
  Tooltip,
  Paper,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
import ChecklistIcon from '@mui/icons-material/Checklist'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useSesionById } from '@/hooks/useAsistenciaSesiones'
import { useDetalleSesion, useRegistrarAsistencia } from '@/hooks/useAsistenciaDetalle'
import { useJudokas } from '@/hooks/useJudokas'
import MarcarAsistenciaForm from '@/components/asistencia/MarcarAsistenciaForm'
import { AsistenciaDetalleUpsert } from '@/models/asistencia'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

interface Props {
  sesionId: string
}

export default function MarcarAsistenciaPage({ sesionId }: Props) {
  const router = useRouter()
  const { user } = useAuth()

  const isSensei = user?.rol === ROL.SENSEI
  const isEncargado = user?.rol === ROL.ENCARGADO
  const isAdmin = user?.rol === ROL.ADMIN

  // Datos de la sesión
  const sesionQuery = useSesionById(sesionId)
  const detalleQuery = useDetalleSesion(sesionId)

  // Filtramos por el sensei de la sesión. Mientras carga la sesión, el sensei
  // usa su propio ID como fallback para no esperar la carga.
  const sesionSenseiId = sesionQuery.data?.sensei_id || null
  const senseiId = sesionSenseiId || (isSensei ? (user?.sensei_id || undefined) : undefined)
  const autoFetchJudokas = !!sesionSenseiId || (isSensei && !!user?.sensei_id)

  const judokasQuery = useJudokas({
    entrenadorId: senseiId,
    clubId: undefined,
    autoFetch: autoFetchJudokas,
  })

  // Filtrar y ordenar judokas
  const sesionFecha = sesionQuery.data?.fecha
  const judokasElegibles = useMemo(() => {
    let filtered = judokasQuery.judokas
    if (sesionFecha) {
      filtered = judokasQuery.judokas.filter(j => {
        if (!j.created_at) return true
        const d = new Date(j.created_at)
        const inscripcionLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return inscripcionLocal <= sesionFecha
      })
    }

    // Ordenar por apellidos (alfabético)
    return [...filtered].sort((a, b) => {
      const apellidoA = (a.apellidos || '').trim().toLowerCase()
      const apellidoB = (b.apellidos || '').trim().toLowerCase()
      if (apellidoA !== apellidoB) {
        return apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' })
      }
      return (a.nombres || '').localeCompare(b.nombres || '', 'es', { sensitivity: 'base' })
    })
  }, [judokasQuery.judokas, sesionFecha])

  // Mutation para guardar
  const guardarMutation = useRegistrarAsistencia(
    user?.sensei_id || undefined, 
    user?.club_id || undefined
  )

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  const handleGuardar = async (asistencias: AsistenciaDetalleUpsert[]) => {
    const res = await guardarMutation.mutateAsync({ sesionId, asistencias })
    if (res.success) {
      setSnackbar({ open: true, message: 'Asistencia guardada correctamente', severity: 'success' })
      // Esperar un poco para que el usuario vea el mensaje y luego volver
      setTimeout(() => {
        router.push('/asistencia')
      }, 1000)
    } else {
      setSnackbar({ open: true, message: res.error || 'Error al guardar', severity: 'error' })
    }
    return res
  }

  const sesion = sesionQuery.data
  const isLoadingSesion = sesionQuery.isLoading
  const isLoadingDetalle = detalleQuery.isLoading
  const isLoadingJudokas = judokasQuery.isLoading
  const isLoading = isLoadingSesion || isLoadingDetalle || isLoadingJudokas

  const fechaFormateada = sesion?.fecha
    ? dayjs(sesion.fecha).format('dddd D [de] MMMM YYYY')
    : ''

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.SENSEI, ROL.ENCARGADO]}>
      <Box sx={{ maxWidth: 680, mx: 'auto' }}>
        {/* ── Navegación y header ── */}
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Tooltip title="Volver a sesiones">
            <IconButton
              onClick={() => router.push('/asistencia')}
              aria-label="Volver al listado de sesiones"
              sx={{ minWidth: '44px', minHeight: '44px' }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ChecklistIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Tomar lista
            </Typography>
          </Stack>
        </Stack>

        {/* ── Info de la sesión ── */}
        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}
        >
          {isLoadingSesion ? (
            <Stack spacing={1}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" height={20} />
              <Skeleton width="30%" height={20} />
            </Stack>
          ) : sesionQuery.error ? (
            <Alert severity="error">
              No se pudo cargar la sesión. Intenta volver y abrirla de nuevo.
            </Alert>
          ) : sesion ? (
            <Stack spacing={0.75}>
              {sesion.titulo && (
                <Typography variant="h6" fontWeight="600" lineHeight={1.3}>
                  {sesion.titulo}
                </Typography>
              )}

              <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                <CalendarTodayIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {fechaFormateada}
                </Typography>
              </Stack>

              {sesion.hora_inicio && (
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {sesion.hora_inicio}{sesion.hora_fin ? ` – ${sesion.hora_fin}` : ''}
                  </Typography>
                </Stack>
              )}

              {sesion.nombre_sensei && (
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {sesion.nombre_sensei}
                  </Typography>
                </Stack>
              )}

              {judokasElegibles.length > 0 && !isLoading && (
                <Chip
                  label={`${judokasElegibles.length} judokas`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                />
              )}
            </Stack>
          ) : null}
        </Paper>

        <Divider sx={{ mb: 3 }} />

        {/* ── Formulario de asistencia ── */}
        {isLoading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="rounded" height={56} />
            ))}
          </Stack>
        ) : (judokasQuery.error || sesionQuery.error) ? (
          <Alert severity="error">
            {judokasQuery.error ?? 'No se pudo cargar la lista de judokas.'}
          </Alert>
        ) : judokasElegibles.length === 0 ? (
          <Alert severity="info">
            {isSensei
              ? 'No tienes judokas asignados que estuvieran inscritos en la fecha de esta sesión.'
              : 'No hay judokas del club inscritos en la fecha de esta sesión.'}
          </Alert>
        ) : (
          <MarcarAsistenciaForm
            sesionId={sesionId}
            marcadoPor={user?.id ?? ''}
            judokas={judokasElegibles}
            detalleExistente={detalleQuery.data ?? []}
            onGuardar={handleGuardar}
            guardandoLoading={guardarMutation.isPending}
          />
        )}

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            role="status"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ProtectedRoute>
  )
}
