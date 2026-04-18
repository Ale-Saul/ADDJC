'use client'

import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Divider,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChecklistIcon from '@mui/icons-material/Checklist'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAsistenciaPage } from '@/hooks/useAsistenciaPage'
import SesionCard from '@/components/asistencia/SesionCard'
import NuevaSesionForm from '@/components/asistencia/NuevaSesionForm'

export default function AsistenciaPage() {
  const {
    user,
    isSensei,
    isEncargado,
    isAdmin,
    senseiId,
    clubId,
    sesiones,
    isLoading,
    fetchError,
    filtros,
    dialog,
    handleCrearSesion,
    handleEliminarSesion,
    eliminarLoading,
    crearLoading,
    snackbar,
    cerrarSnackbar,
  } = useAsistenciaPage()

  const tieneFilrosActivos =
    filtros.fechaInicio !== '' ||
    filtros.fechaFin !== '' ||
    filtros.senseiId !== 'all'

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.SENSEI, ROL.ENCARGADO]}>
      <Box>
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 4,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ChecklistIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Asistencia
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isSensei ? 'Tus sesiones de clase' : 'Sesiones del club'}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={dialog.abrir}
            sx={{ minHeight: '44px', whiteSpace: 'nowrap' }}
            aria-label="Crear nueva sesión de asistencia"
          >
            Nueva sesión
          </Button>
        </Box>

        {/* ── Filtros (solo encargado / admin) ── */}
        {(isEncargado || isAdmin) && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              mb={1.5}
              flexWrap="wrap"
            >
              <FilterListIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight="600">
                Filtros
              </Typography>
              {tieneFilrosActivos && (
                <Chip
                  label="Limpiar"
                  size="small"
                  icon={<ClearIcon />}
                  onClick={filtros.limpiarFiltros}
                  variant="outlined"
                  color="default"
                  clickable
                  sx={{ cursor: 'pointer' }}
                />
              )}
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  fullWidth
                  value={filtros.fechaInicio}
                  onChange={e => filtros.setFechaInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  fullWidth
                  value={filtros.fechaFin}
                  onChange={e => filtros.setFechaFin(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {filtros.senseiOptions.length > 0 && (
                <Grid item xs={12} sm={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Sensei</InputLabel>
                    <Select
                      label="Sensei"
                      value={filtros.senseiId}
                      onChange={e => filtros.setSenseiId(e.target.value)}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      {filtros.senseiOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* ── Contenido ── */}
        {fetchError && (
          <Alert severity="error" sx={{ mb: 3 }} role="alert">
            {fetchError}
          </Alert>
        )}

        {isLoading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={180} />
              </Grid>
            ))}
          </Grid>
        ) : sesiones.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <ChecklistIcon sx={{ fontSize: 56, opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {tieneFilrosActivos ? 'Sin sesiones para los filtros aplicados' : 'Aún no hay sesiones registradas'}
            </Typography>
            <Typography variant="body2">
              {tieneFilrosActivos
                ? 'Prueba ajustando los filtros o limpiándolos.'
                : 'Crea la primera sesión con el botón "Nueva sesión".'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {sesiones.map(sesion => (
              <Grid item xs={12} sm={6} md={4} key={sesion.id}>
                <SesionCard
                  sesion={sesion}
                  mostrarSensei={isEncargado || isAdmin}
                  onEliminar={handleEliminarSesion}
                  eliminarLoading={eliminarLoading}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Dialog nueva sesión ── */}
        <Dialog
          open={dialog.open}
          onClose={dialog.cerrar}
          fullWidth
          maxWidth="sm"
          aria-labelledby="nueva-sesion-dialog-title"
        >
          <DialogTitle id="nueva-sesion-dialog-title" fontWeight="bold">
            Nueva sesión de clase
          </DialogTitle>
          <DialogContent>
            <NuevaSesionForm
              clubId={clubId}
              senseiId={senseiId}
              createdBy={user?.id ?? ''}
              onSuccess={handleCrearSesion}
              onCancel={dialog.cerrar}
            />
          </DialogContent>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={cerrarSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={cerrarSnackbar}
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
