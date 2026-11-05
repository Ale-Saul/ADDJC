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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ChecklistIcon from '@mui/icons-material/Checklist'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { getOperationalClubId, resolveAsistenciaView } from '@/utils/roleAccess'
import { useSesionById } from '@/hooks/useAsistenciaSesiones'
import { useDetalleSesion, useRegistrarAsistencia } from '@/hooks/useAsistenciaDetalle'
import { useJudokas } from '@/hooks/useJudokas'
import { judokaController } from '@/controllers/judokaController'
import MarcarAsistenciaForm from '@/components/asistencia/MarcarAsistenciaForm'
import { AsistenciaDetalleUpsert } from '@/models/asistencia'
import { Judoka } from '@/models/judoka'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

interface Props {
  sesionId: string
}

export default function MarcarAsistenciaPage({ sesionId }: Props) {
  const router = useRouter()
  const { user } = useAuth()

  const asistenciaView = resolveAsistenciaView(user)
  const isSensei = asistenciaView === 'sensei'
  const isEncargado = asistenciaView === 'encargado'
  const isAdmin = asistenciaView === 'admin'
  const operationalClubId = getOperationalClubId(user)

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

  // Filtro estricto por categoría de la sesión (primaria o secundaria)
  const sesionFecha = sesionQuery.data?.fecha
  const sesionCategoria = sesionQuery.data?.categoria

  // Estado para futbolistas invitados adicionales
  const [invitados, setInvitados] = useState<Judoka[]>([])
  const [openModalInvitado, setOpenModalInvitado] = useState(false)
  const [invitadoSeleccionado, setInvitadoSeleccionado] = useState<Judoka | null>(null)

  // Consultar todos los futbolistas del club para el selector de invitados y para hidratar detalles existentes
  const clubId = sesionQuery.data?.club_id || operationalClubId || user?.club_id
  const { data: todosClubRes } = useQuery({
    queryKey: ['judokas', 'club', clubId],
    queryFn: () => clubId ? judokaController.getJudokasByClub(clubId) : judokaController.getAllJudokas(),
    enabled: openModalInvitado || (detalleQuery.data?.length ?? 0) > 0,
  })
  const todosClubJudokas = useMemo(() => todosClubRes?.data || [], [todosClubRes])

  // Filtrar y ordenar futbolistas asignados
  const judokasElegibles = useMemo(() => {
    let filtered = judokasQuery.judokas
    if (sesionFecha) {
      filtered = filtered.filter(j => {
        if (!j.created_at) return true
        const d = new Date(j.created_at)
        const inscripcionLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return inscripcionLocal <= sesionFecha
      })
    }

    // Filtrar por la categoría de la sesión (primaria o secundaria, case-insensitive)
    if (sesionCategoria) {
      const catLower = sesionCategoria.trim().toLowerCase()
      filtered = filtered.filter(j => 
        (j.categoria || '').trim().toLowerCase() === catLower ||
        (j.categoria_secundaria || '').trim().toLowerCase() === catLower
      )
    }

    return filtered
  }, [judokasQuery.judokas, sesionFecha, sesionCategoria])

  // Lista consolidada: elegibles + historial existente en la sesión + invitados manuales
  const listaConsolidada = useMemo(() => {
    const map = new Map<string, Judoka>()

    // 1. Agregar elegibles
    judokasElegibles.forEach(j => map.set(j.id, j))

    // 2. Si ya hay registros guardados en esta sesión y están en la bd del club, agregarlos
    if (detalleQuery.data && detalleQuery.data.length > 0 && todosClubJudokas.length > 0) {
      detalleQuery.data.forEach(d => {
        if (!map.has(d.judoka_id)) {
          const found = todosClubJudokas.find(j => j.id === d.judoka_id)
          if (found) map.set(found.id, found)
        }
      })
    }

    // 3. Agregar invitados seleccionados en esta pantalla
    invitados.forEach(j => map.set(j.id, j))

    // Ordenar alfabéticamente por apellido
    return Array.from(map.values()).sort((a, b) => {
      const apellidoA = (a.apellidos || '').trim().toLowerCase()
      const apellidoB = (b.apellidos || '').trim().toLowerCase()
      if (apellidoA !== apellidoB) {
        return apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' })
      }
      return (a.nombres || '').localeCompare(b.nombres || '', 'es', { sensitivity: 'base' })
    })
  }, [judokasElegibles, detalleQuery.data, todosClubJudokas, invitados])

  // Lista de posibles invitados (futbolistas del club que aún no están en la lista)
  const candidatosInvitados = useMemo(() => {
    const idsActuales = new Set(listaConsolidada.map(j => j.id))
    return todosClubJudokas.filter(j => !idsActuales.has(j.id))
  }, [todosClubJudokas, listaConsolidada])

  const handleAgregarInvitado = () => {
    if (invitadoSeleccionado) {
      setInvitados(prev => [...prev, invitadoSeleccionado])
      setInvitadoSeleccionado(null)
      setOpenModalInvitado(false)
    }
  }

  // Mutation para guardar
  const guardarMutation = useRegistrarAsistencia(
    user?.sensei_id || undefined, 
    operationalClubId || undefined
  )

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  const handleGuardar = async (asistencias: AsistenciaDetalleUpsert[]) => {
    const res = await guardarMutation.mutateAsync({ sesionId, asistencias })
    if (res.success) {
      setSnackbar({ open: true, message: 'Asistencia guardada correctamente', severity: 'success' })
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
            <Stack spacing={1}>
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

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {sesion.categoria && (
                    <Chip
                      label={`Categoría: ${sesion.categoria}`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    />
                  )}
                  {listaConsolidada.length > 0 && !isLoading && (
                    <Chip
                      label={`${listaConsolidada.length} futbolista${listaConsolidada.length === 1 ? '' : 's'}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                  {invitados.length > 0 && (
                    <Chip
                      label={`+${invitados.length} invitado${invitados.length === 1 ? '' : 's'}`}
                      size="small"
                      color="secondary"
                    />
                  )}
                </Stack>

                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setOpenModalInvitado(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  + Agregar Invitado
                </Button>
              </Stack>
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
            {judokasQuery.error ?? 'No se pudo cargar la lista de futbolistas.'}
          </Alert>
        ) : listaConsolidada.length === 0 ? (
          <Stack spacing={2}>
            <Alert severity="info">
              {isSensei
                ? 'No hay futbolistas asignados a esta categoría en la fecha de la sesión. Puedes agregar futbolistas invitados con el botón superior.'
                : 'No hay futbolistas inscritos para esta sesión. Puedes agregar futbolistas invitados con el botón superior.'}
            </Alert>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenModalInvitado(true)}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Agregar Futbolista Invitado
            </Button>
          </Stack>
        ) : (
          <MarcarAsistenciaForm
            sesionId={sesionId}
            marcadoPor={user?.id ?? ''}
            judokas={listaConsolidada}
            detalleExistente={detalleQuery.data ?? []}
            onGuardar={handleGuardar}
            guardandoLoading={guardarMutation.isPending}
          />
        )}

        {/* ── Modal de Agregar Invitado ── */}
        <Dialog
          open={openModalInvitado}
          onClose={() => setOpenModalInvitado(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontWeight: 'bold' }}>
            Agregar Futbolista Invitado
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona un jugador del club que participe en este entrenamiento:
            </Typography>
            <Autocomplete
              options={candidatosInvitados}
              getOptionLabel={(option) =>
                `${option.nombres} ${option.apellidos} (${option.categoria || 'Sin cat'}${option.posicion ? ' - ' + option.posicion : ''})`
              }
              value={invitadoSeleccionado}
              onChange={(_, value) => setInvitadoSeleccionado(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar jugador por nombre o carnet"
                  placeholder="Escribe el nombre..."
                  size="small"
                  autoFocus
                />
              )}
              noOptionsText="No se encontraron jugadores disponibles"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModalInvitado(false)} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!invitadoSeleccionado}
              onClick={handleAgregarInvitado}
            >
              Agregar a la Sesión
            </Button>
          </DialogActions>
        </Dialog>

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
