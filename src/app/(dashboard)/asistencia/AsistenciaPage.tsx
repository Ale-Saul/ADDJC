'use client'

import { useState } from 'react'
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
  Tabs,
  Tab,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChecklistIcon from '@mui/icons-material/Checklist'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import PersonIcon from '@mui/icons-material/Person'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAsistenciaPage } from '@/hooks/useAsistenciaPage'
import SesionCard from '@/components/asistencia/SesionCard'
import NuevaSesionForm from '@/components/asistencia/NuevaSesionForm'
import MarcarAsistenciaEntrenadorCard from '@/components/asistencia/entrenadores/MarcarAsistenciaEntrenadorCard'
import HistorialAsistenciaEntrenadores from '@/components/asistencia/entrenadores/HistorialAsistenciaEntrenadores'
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

  const [tabIndex, setTabIndex] = useState<number>(0)

  const tieneFiltrosActivos =
    filtros.fechaInicio !== '' ||
    filtros.fechaFin !== '' ||
    filtros.senseiId !== 'all'

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.SENSEI, ROL.ENCARGADO]}>
      <LocalizationProvider 
        dateAdapter={AdapterDayjs} 
        adapterLocale="es"
        localeText={{
          datePickerToolbarTitle: 'Seleccionar fecha',
          cancelButtonLabel: 'Cancelar',
          okButtonLabel: 'Confirmar'
        }}
      >
        <Box>
          {/* ── Header ── */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              mb: 3,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <ChecklistIcon sx={{ fontSize: 36, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Módulo de Asistencia
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isSensei
                    ? 'Gestiona tus clases y marca tu asistencia con constancia satelital'
                    : 'Control de clases, futbolistas y registro GPS de entrenadores'}
                </Typography>
              </Box>
            </Stack>

            {tabIndex === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={dialog.abrir}
                sx={{ minHeight: '44px', whiteSpace: 'nowrap' }}
                aria-label="Crear nueva sesión de asistencia"
              >
                Nueva sesión
              </Button>
            )}
          </Box>

          {/* ── Pestañas de Navegación ── */}
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem' },
            }}
          >
            <Tab
              icon={<ChecklistIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Clases y Alumnos"
            />
            <Tab
              icon={<LocationOnIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Asistencia de Entrenadores (GPS)"
            />
          </Tabs>

          {/* ════════ PESTAÑA 0: CLASES Y ALUMNOS ════════ */}
          {tabIndex === 0 && (
            <Box>
              {/* Check-in rápido para el entrenador */}
              {isSensei && senseiId && clubId && (
                <Box sx={{ mb: 3.5 }}>
                  <MarcarAsistenciaEntrenadorCard
                    entrenadorId={senseiId}
                    clubId={clubId}
                  />
                </Box>
              )}

              {/* Filtros (solo encargado / admin) */}
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
                      Filtros de Clases
                    </Typography>
                    {tieneFiltrosActivos && (
                      <Chip
                        label="Filtros aplicados"
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={filtros.limpiarFiltros}
                      />
                    )}
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    flexWrap="wrap"
                  >
                    <DatePicker
                      label="Desde"
                      value={filtros.fechaInicio ? dayjs(filtros.fechaInicio) : null}
                      onChange={(date) => filtros.setFechaInicio(date ? date.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                    />
                    <DatePicker
                      label="Hasta"
                      value={filtros.fechaFin ? dayjs(filtros.fechaFin) : null}
                      onChange={(date) => filtros.setFechaFin(date ? date.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                    />

                    {filtros.senseiOptions.length > 0 && (
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="sensei-filter-label">Entrenador</InputLabel>
                        <Select
                          labelId="sensei-filter-label"
                          value={filtros.senseiId}
                          label="Entrenador"
                          onChange={(e) => filtros.setSenseiId(e.target.value)}
                        >
                          <MenuItem value="all">Todos los entrenadores</MenuItem>
                          {filtros.senseiOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {tieneFiltrosActivos && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={filtros.limpiarFiltros}
                        sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Mensaje de error al cargar sesiones */}
              {fetchError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {fetchError}
                </Alert>
              )}

              {/* Listado de sesiones */}
              {isLoading ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} variant="rounded" height={160} />
                  ))}
                </Box>
              ) : sesiones.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 2,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No hay sesiones de asistencia registradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {isSensei
                      ? 'Crea tu primera clase para comenzar a tomar lista de tus futbolistas.'
                      : 'No se encontraron sesiones registradas para los filtros aplicados.'}
                  </Typography>
                  {isSensei && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={dialog.abrir}>
                      Crear primera sesión
                    </Button>
                  )}
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
                <Stack spacing={4}>
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
                          mb: 2,
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
                            No hay sesiones registradas para este entrenador en el periodo seleccionado.
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* ════════ PESTAÑA 1: ASISTENCIA DE ENTRENADORES (GPS) ════════ */}
          {tabIndex === 1 && (
            <Stack spacing={3}>
              {/* Si es entrenador, mostrar su tarjeta de check-in / check-out */}
              {isSensei && senseiId && clubId && (
                <Box>
                  <MarcarAsistenciaEntrenadorCard
                    entrenadorId={senseiId}
                    clubId={clubId}
                  />
                </Box>
              )}

              {/* Título de la sección de historial */}
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {isSensei
                    ? 'Mi Historial de Marcaciones'
                    : 'Control de Asistencias y Ubicaciones GPS de Entrenadores'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isSensei
                    ? 'Registro de entradas y salidas de tus entrenamientos y partidos con constancia satelital.'
                    : 'Supervisa los horarios y las ubicaciones en Google Maps donde marcaron los profesores.'}
                </Typography>
              </Box>

              <HistorialAsistenciaEntrenadores
                clubId={clubId || undefined}
                entrenadorId={isSensei ? senseiId : undefined}
                mostrarFiltroEntrenador={!isSensei}
                entrenadoresDisponibles={filtros.senseiOptions.map(o => ({ id: o.value, nombre: o.label }))}
              />
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
              {dialog.open && (
                <NuevaSesionForm
                  clubId={clubId}
                  senseiId={senseiId}
                  createdBy={user?.id ?? ''}
                  onSuccess={handleCrearSesion}
                  onCancel={dialog.cerrar}
                />
              )}
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
