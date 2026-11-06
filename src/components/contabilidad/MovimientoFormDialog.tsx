import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material'
import { FormProvider, useWatch } from 'react-hook-form'

import { MovimientoFinanciero } from '@/models/movimientoFinanciero'
import { useClubes } from '@/hooks/useClubes'
import { FormInput, FormSelect } from '@/components/ui'
import { useMovimientoForm, MovimientoFormValues } from '@/hooks/useMovimientoForm'
import { SubmitHandler } from 'react-hook-form'
import { senseiController } from '@/controllers/senseiController'
import { Sensei } from '@/models/sensei'

interface MovimientoFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  movimiento: MovimientoFinanciero | null
  defaultClubId?: string
  initialTipo?: 'ingreso' | 'egreso'
}

const CATEGORIAS_INGRESO = [
  { value: 'cuota_mensual', label: 'Cuota Mensual / Mensualidad' },
  { value: 'matricula_inscripcion', label: 'Matrícula / Inscripción' },
  { value: 'venta_indumentaria', label: 'Venta de Indumentaria / Uniformes' },
  { value: 'sponsor', label: 'Patrocinio / Sponsor' },
  { value: 'donacion_club', label: 'Donación al Club' },
  { value: 'evento', label: 'Evento / Torneo / Rifa' },
  { value: 'pago_club', label: 'Pago de Club' },
  { value: 'aporte_estado', label: 'Aporte del Estado' },
  { value: 'otro', label: 'Otro Ingreso' }
]

const CATEGORIAS_EGRESO = [
  { value: 'alquiler_cancha', label: 'Alquiler de Cancha / Instalaciones' },
  { value: 'pago_entrenador', label: 'Pago a Entrenadores / Sueldos' },
  { value: 'pago_arbitro', label: 'Pago de Arbitraje' },
  { value: 'equipamiento', label: 'Compra de Material Deportivo' },
  { value: 'indumentaria', label: 'Compra de Uniformes / Indumentaria' },
  { value: 'transporte_viaticos', label: 'Transporte / Viáticos' },
  { value: 'inscripcion_torneo', label: 'Inscripción a Torneo / Liga' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'gasto_operativo', label: 'Gasto Operativo' },
  { value: 'gastos_operativos', label: 'Gastos Operativos' },
  { value: 'pago_proveedor', label: 'Pago a Proveedor' },
  { value: 'evento', label: 'Gastos de Evento / Torneo' },
  { value: 'otro', label: 'Otro Egreso' }
]

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export const MovimientoFormDialog: React.FC<MovimientoFormDialogProps> = ({
  open,
  onClose,
  onSave,
  movimiento,
  defaultClubId,
  initialTipo
}) => {
  const {
    form,
    loading,
    error,
    uploadingFile,
    comprobanteFile,
    comprobanteUrl,
    comprobanteNombre,
    handleFileChange,
    clearComprobante,
    onSubmit
  } = useMovimientoForm(movimiento, onClose, onSave, defaultClubId, initialTipo)

  const { clubes } = useClubes()

  const tipo = useWatch({ control: form.control, name: 'tipo' })
  const categoria = useWatch({ control: form.control, name: 'categoria' })
  const fechaVal = useWatch({ control: form.control, name: 'fecha' })

  const isIngreso = tipo === 'ingreso'
  const requiresClub = !defaultClubId && isIngreso && (categoria === 'pago_club' || categoria === 'donacion_club')
  const requiresEntidad = isIngreso && (categoria === 'aporte_estado' || categoria === 'sponsor')

  // Estado para autocompletar pago a entrenador (ej: "Enero profe Alvaro")
  const [entrenadores, setEntrenadores] = useState<Sensei[]>([])
  const [entrenadorSeleccionadoId, setEntrenadorSeleccionadoId] = useState<string>('')
  const [mesSueldo, setMesSueldo] = useState<string>(() => {
    const mesIndex = new Date().getMonth()
    return MESES[mesIndex] || 'Enero'
  })

  // Cargar entrenadores cuando el modal se abre
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const loadSenseis = async () => {
      const res = defaultClubId
        ? await senseiController.getSenseisByClub(defaultClubId)
        : await senseiController.getAllSenseis(true)
      if (cancelled) return
      if (res.success && res.data) {
        const ordenados = [...res.data].sort((a, b) =>
          (a.nombres || '').localeCompare(b.nombres || '')
        )
        setEntrenadores(ordenados)
      }
    }
    void loadSenseis()
    return () => {
      cancelled = true
    }
  }, [open, defaultClubId])

  // Sincronizar mes por defecto según la fecha del formulario
  useEffect(() => {
    if (fechaVal) {
      const partes = fechaVal.split('-')
      if (partes.length === 3) {
        const mIndex = parseInt(partes[1], 10) - 1
        if (mIndex >= 0 && mIndex < 12) {
          setMesSueldo(MESES[mIndex])
        }
      }
    }
  }, [fechaVal])

  const actualizarConceptoEntrenador = (nuevoEntrenadorId: string, nuevoMes: string) => {
    if (!nuevoEntrenadorId) return
    const ent = entrenadores.find((e) => e.id === nuevoEntrenadorId)
    if (ent) {
      const primerNombre = (ent.nombres || '').trim().split(' ')[0]
      const conceptoGenerado = `${nuevoMes} profe ${primerNombre}`
      form.setValue('concepto', conceptoGenerado, { shouldValidate: true })

      const descActual = form.getValues('descripcion')
      if (!descActual || descActual.startsWith('Pago de honorarios / sueldo a profe')) {
        form.setValue(
          'descripcion',
          `Pago de honorarios / sueldo a profe ${ent.nombres} ${ent.apellidos}`
        )
      }
    }
  }

  const handleEntrenadorChange = (id: string) => {
    setEntrenadorSeleccionadoId(id)
    actualizarConceptoEntrenador(id, mesSueldo)
  }

  const handleMesChange = (m: string) => {
    setMesSueldo(m)
    actualizarConceptoEntrenador(entrenadorSeleccionadoId, m)
  }

  const formatTextCapitalized = (val: string) => {
    if (!val) return ''
    // Remover espacios inicales extras que causan que el string empiece con espacio,
    // pero permitimos escribir espacios normales entre palabras.
    let singleSpace = val.replace(/\s+/g, ' ')
    // Si empieza con espacio, lo quitamos
    if (singleSpace.startsWith(' ')) {
      singleSpace = singleSpace.slice(1)
    }
    if (singleSpace.length > 0) {
      return singleSpace.charAt(0).toUpperCase() + singleSpace.slice(1)
    }
    return singleSpace
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {movimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}
      </DialogTitle>
      
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={3}>
              <Box>
                <FormSelect control={form.control}
                  name="tipo"
                  label="Tipo de Movimiento"
                  options={[
                    { value: 'ingreso', label: 'Ingreso' },
                    { value: 'egreso', label: 'Egreso' }
                  ]}
                  disabled={!!movimiento}
                  fullWidth
                />
              </Box>

              <Box>
                <FormSelect control={form.control}
                  name="categoria"
                  label="Categoría"
                  options={isIngreso ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO}
                  fullWidth
                />
              </Box>

              {!isIngreso && categoria === 'pago_entrenador' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                    border: '1px solid',
                    borderColor: 'primary.light',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        Asistente de Pago a Entrenador
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Selecciona el mes y el entrenador para autocompletar el concepto (ej: &quot;Enero profe Alvaro&quot;):
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                        <InputLabel id="mes-select-label">Mes</InputLabel>
                        <Select
                          labelId="mes-select-label"
                          label="Mes"
                          value={mesSueldo}
                          onChange={(e) => handleMesChange(e.target.value)}
                        >
                          {MESES.map((m) => (
                            <MenuItem key={m} value={m}>
                              {m}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small">
                        <InputLabel id="entrenador-select-label">Entrenador a pagar</InputLabel>
                        <Select
                          labelId="entrenador-select-label"
                          label="Entrenador a pagar"
                          value={entrenadorSeleccionadoId}
                          onChange={(e) => handleEntrenadorChange(e.target.value)}
                        >
                          <MenuItem value="">
                            <em>{entrenadores.length > 0 ? 'Selecciona un entrenador...' : 'Cargando entrenadores...'}</em>
                          </MenuItem>
                          {entrenadores.map((ent) => (
                            <MenuItem key={ent.id} value={ent.id}>
                              {ent.nombres} {ent.apellidos}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>
                </Box>
              )}

              <Box>
                <FormInput control={form.control}
                  name="monto"
                  label="Monto"
                  type="number"
                  inputProps={{ step: '0.01', min: '0.01' }}
                  fullWidth
                />
              </Box>

              <Box>
                <FormInput control={form.control}
                  name="fecha"
                  label="Fecha"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>

              <Box>
                <FormInput control={form.control}
                  name="concepto"
                  label="Concepto"
                  placeholder={!isIngreso && categoria === 'pago_entrenador' ? 'Ej: Enero profe Alvaro' : 'Ej: Pago de cuota enero 2024'}
                  fullWidth
                  formatValue={formatTextCapitalized}
                />
              </Box>

              {requiresClub && (
                <Box>
                  <FormSelect control={form.control}
                    name="origenClubId"
                    label="Club de Origen"
                    options={[
                      { value: '', label: 'Seleccione un club...' },
                      ...clubes.map(c => ({ value: c.id, label: c.nombre_club }))
                    ]}
                    fullWidth
                  />
                </Box>
              )}

              {requiresEntidad && (
                <Box>
                  <FormInput control={form.control}
                    name="origenEntidad"
                    label="Entidad de Origen"
                    placeholder="Ej: Ministerio de Deportes, Sponsor X"
                    fullWidth
                    formatValue={formatTextCapitalized}
                  />
                </Box>
              )}

              <Box>
                <FormInput control={form.control}
                  name="descripcion"
                  label="Descripción Adicional (Opcional)"
                  multiline
                  rows={3}
                  fullWidth
                  formatValue={formatTextCapitalized}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Comprobante (Opcional)
                </Typography>
                
                <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center', bgcolor: 'background.default' }}>
                  {comprobanteUrl || comprobanteFile ? (
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {comprobanteFile ? comprobanteFile.name : comprobanteNombre || 'Comprobante adjunto'}
                      </Typography>
                      {comprobanteUrl && !comprobanteFile && (
                        <Button 
                          size="small" 
                          href={comprobanteUrl} 
                          target="_blank"
                          sx={{ ml: 1 }}
                        >
                          Ver
                        </Button>
                      )}
                      <IconButton size="small" color="error" onClick={clearComprobante} title="Eliminar archivo">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                    >
                      Seleccionar Archivo
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </Button>
                  )}
                  {uploadingFile && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      Preparando archivo...
                    </Typography>
                  )}
                </Box>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} disabled={loading || uploadingFile}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || uploadingFile}
              startIcon={(loading || uploadingFile) && <CircularProgress size={20} />}
            >
              {loading ? 'Guardando...' : 'Guardar Movimiento'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}
