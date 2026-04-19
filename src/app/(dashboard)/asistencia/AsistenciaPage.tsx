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
  Paper,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChecklistIcon from '@mui/icons-material/Checklist'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import PersonIcon from '@mui/icons-material/Person'
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
    sesionesAgrupadas,
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

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3.5}>
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
              <Grid item xs={12} sm={3.5}>
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
                <Grid item xs={12} sm={5}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Filtrar por Sensei</InputLabel>
                    <Select
                      label="Filtrar por Sensei"
                      value={filtros.senseiId}
                      onChange={e => filtros.setSenseiId(e.target.value)}
                    >
                      <MenuItem value="all">Todos los senseis del club</MenuItem>
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
        ) : isSensei ? (
          <Grid container spacing={2}>
            {sesiones.map(sesion => (
              <Grid item xs={12} sm={6} md={4} key={sesion.id}>
                <SesionCard
                  sesion={sesion}
                  mostrarSensei={false}
                  onEliminar={handleEliminarSesion}
                  eliminarLoading={eliminarLoading}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Stack spacing={5}>
            {sesionesAgrupadas?.map(grupo => (
              <Box key={grupo.id}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2.5,
                    color: grupo.id === senseiId ? 'primary.main' : 'text.primary',
                  }}
                >
                  <PersonIcon fontSize="small" />
                  {grupo.id === senseiId ? `Mis clases (${grupo.nombre})` : `Clases de ${grupo.nombre}`}
                  <Chip
                    label={`${grupo.sesiones.length} sesión${grupo.sesiones.length === 1 ? '' : 'es'}`}
                    size="small"
                    variant="outlined"
                    color={grupo.id === senseiId ? 'primary' : 'default'}
                    sx={{ ml: 1, fontWeight: 500 }}
                  />
                </Typography>
                
                <Grid container spacing={2}>
                  {grupo.sesiones.length > 0 ? (
                    grupo.sesiones.map(sesion => (
                      <Grid item xs={12} sm={6} md={4} key={sesion.id}>
                        <SesionCard
                          sesion={sesion}
                          mostrarSensei={false}
                          onEliminar={handleEliminarSesion}
                          eliminarLoading={eliminarLoading}
                        />
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          bgcolor: 'grey.50',
                          borderStyle: 'dashed',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No hay sesiones registradas para este sensei en el periodo seleccionado.
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
          </Stack>
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
