'use client'

import {
  Box,
  Typography,
  Button,
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/es'
import dayjs from 'dayjs'

dayjs.locale('es')

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
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
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

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: filtros.senseiOptions.length > 0
                ? { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1.5fr' }
                : { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              alignItems: 'center',
            }}>
              <DatePicker
                label="Desde"
                format="DD/MM/YYYY"
                value={filtros.fechaInicio ? dayjs(filtros.fechaInicio) : null}
                onChange={(newValue) => filtros.setFechaInicio(newValue ? newValue.format('YYYY-MM-DD') : '')}
                maxDate={filtros.fechaFin ? dayjs(filtros.fechaFin) : dayjs()}
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true,
                    InputLabelProps: { shrink: true }
                  } 
                }}
              />
              <DatePicker
                label="Hasta"
                format="DD/MM/YYYY"
                value={filtros.fechaFin ? dayjs(filtros.fechaFin) : null}
                onChange={(newValue) => filtros.setFechaFin(newValue ? newValue.format('YYYY-MM-DD') : '')}
                minDate={filtros.fechaInicio ? dayjs(filtros.fechaInicio) : undefined}
                maxDate={dayjs()}
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true,
                    InputLabelProps: { shrink: true }
                  } 
                }}
              />
              {filtros.senseiOptions.length > 0 && (
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
              )}
            </Box>
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} variant="rounded" height={180} />
            ))}
          </Box>
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {sesiones.map(sesion => (
              <SesionCard
                key={sesion.id}
                sesion={sesion}
                mostrarSensei={false}
                onEliminar={handleEliminarSesion}
                eliminarLoading={eliminarLoading}
              />
            ))}
          </Box>
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

                {grupo.sesiones.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {grupo.sesiones.map(sesion => (
                      <SesionCard
                        key={sesion.id}
                        sesion={sesion}
                        mostrarSensei={false}
                        onEliminar={handleEliminarSesion}
                        eliminarLoading={eliminarLoading}
                      />
                    ))}
                  </Box>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderStyle: 'dashed', borderRadius: 2 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No hay sesiones registradas para este sensei en el periodo seleccionado.
                    </Typography>
                  </Paper>
                )}
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
      </LocalizationProvider>
    </ProtectedRoute>
  )
}
