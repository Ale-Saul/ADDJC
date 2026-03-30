import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material'
import { FormProvider, useWatch } from 'react-hook-form'

import { MovimientoFinanciero } from '@/models/movimientoFinanciero'
import { useClubList } from '@/hooks/useClubList'
import { FormInput, FormSelect, FormDatePicker, FormAutocomplete } from '@/components/ui'
import { useMovimientoForm } from '@/hooks/useMovimientoForm'
import { formatNameWithNumbersInput } from '@/utils/formatters'
import dayjs from 'dayjs'

interface MovimientoFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  movimiento: MovimientoFinanciero | null
}

const CATEGORIAS_INGRESO = [
  { value: 'pago_club', label: 'Pago de Club' },
  { value: 'inscripcion_torneo', label: 'Inscripción a Torneo' },
  { value: 'donacion_club', label: 'Donación de Club' },
  { value: 'aporte_estado', label: 'Aporte del Estado' },
  { value: 'sponsor', label: 'Sponsor/Patrocionio' },
  { value: 'otro', label: 'Otro Ingreso' }
]

const CATEGORIAS_EGRESO = [
  { value: 'pago_arbitro', label: 'Pago a Árbitro' },
  { value: 'gastos_operativos', label: 'Gastos Operativos' },
  { value: 'equipamiento', label: 'Compra de Equipamiento' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'evento', label: 'Gastos de Evento/Torneo' },
  { value: 'otro', label: 'Otro Egreso' }
]

export const MovimientoFormDialog: React.FC<MovimientoFormDialogProps> = ({
  open,
  onClose,
  onSave,
  movimiento
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
  } = useMovimientoForm(movimiento, onClose, onSave)

  const { state: { clubes } } = useClubList()

  const watchTipo = useWatch({ control: form.control, name: 'tipo' })
  const watchCategoria = useWatch({ control: form.control, name: 'categoria' })

  const isIngreso = watchTipo === 'ingreso'
  const requiresClub = isIngreso && (watchCategoria === 'pago_club' || watchCategoria === 'donacion_club')
  const requiresEntidad = isIngreso && (watchCategoria === 'aporte_estado' || watchCategoria === 'sponsor')

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {movimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}
      </DialogTitle>
      
      <FormProvider {...form}>
        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={3}>
              <FormAutocomplete
                control={form.control}
                name="tipo"
                label="Tipo de Movimiento"
                options={[
                  { value: 'ingreso', label: 'Ingreso' },
                  { value: 'egreso', label: 'Egreso' }
                ]}
                disabled={!!movimiento || loading}
                required
              />

              <FormAutocomplete
                control={form.control}
                name="categoria"
                label="Categoría"
                options={watchTipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO}
                disabled={loading}
                required
                key={`categoria-${watchTipo}`} // Forzar re-renderizado cuando cambia el tipo
              />

              <FormInput
                control={form.control}
                name="concepto"
                label="Concepto"
                disabled={loading}
                required
                formatValue={formatNameWithNumbersInput}
              />

              <FormInput
                control={form.control}
                name="descripcion"
                label="Descripción Adicional (Opcional)"
                multiline
                rows={2}
                disabled={loading}
                formatValue={formatNameWithNumbersInput}
              />

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormInput
                  control={form.control}
                  name="monto"
                  label="Monto"
                  type="number"
                  disabled={loading}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                  }}
                />

                <TextField
                  label="Fecha"
                  value={dayjs().format('DD/MM/YYYY HH:mm')}
                  fullWidth
                  disabled
                />
              </Box>

              {requiresClub && (
                <FormAutocomplete
                  control={form.control}
                  name="origenClubId"
                  label="Club de Origen"
                  options={clubes.map(c => ({ value: c.id, label: c.nombre_club }))}
                  disabled={loading}
                  required
                />
              )}

              {requiresEntidad && (
                <FormInput
                  control={form.control}
                  name="origenEntidad"
                  label="Entidad de Origen"
                  placeholder="Ej: Ministerio de Deportes, Sponsor X"
                  disabled={loading}
                  required
                  formatValue={formatNameWithNumbersInput}
                />
              )}

              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                  COMPROBANTE (OPCIONAL)
                </Typography>
                
                <Box sx={{ 
                  border: '1px dashed', 
                  borderColor: 'divider',
                  p: 3, 
                  borderRadius: 2, 
                  textAlign: 'center', 
                  bgcolor: 'grey.50',
                  '&:hover': { bgcolor: 'grey.100' }
                }}>
                  {comprobanteUrl || comprobanteFile ? (
                    <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                      <DescriptionIcon color="primary" sx={{ fontSize: 32 }} />
                      <Box textAlign="left" sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap fontWeight="medium">
                          {comprobanteFile ? comprobanteFile.name : comprobanteNombre || 'Comprobante adjunto'}
                        </Typography>
                        {comprobanteUrl && !comprobanteFile && (
                          <Typography 
                            variant="caption" 
                            component="a" 
                            href={comprobanteUrl} 
                            target="_blank"
                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            Ver archivo actual
                          </Typography>
                        )}
                      </Box>
                      <IconButton size="small" color="error" onClick={clearComprobante} disabled={loading}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      disabled={loading || uploadingFile}
                      sx={{ textTransform: 'none', px: 4 }}
                    >
                      SELECCIONAR ARCHIVO
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </Button>
                  )}
                  {uploadingFile && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="text.secondary">
                        Preparando archivo...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
            <Button 
              onClick={onClose} 
              disabled={loading || uploadingFile}
              variant="outlined"
              sx={{ px: 3 }}
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || uploadingFile}
              sx={{ px: 3, minWidth: 180 }}
              startIcon={(loading || uploadingFile) && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'GUARDANDO...' : 'GUARDAR MOVIMIENTO'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  )
}

export default MovimientoFormDialog
