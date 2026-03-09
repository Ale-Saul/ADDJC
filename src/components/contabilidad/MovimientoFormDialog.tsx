import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Grid,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs from 'dayjs'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import {
  MovimientoFinanciero,
  MovimientoFinancieroInput,
  TipoMovimiento,
  CategoriaMovimiento,
} from '@/models/movimientoFinanciero'
import { Club } from '@/models/club'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'
import { storageService } from '@/services/storageService'
import { useAuth } from '@/contexts/AuthContext'

interface MovimientoFormDialogProps {
  open: boolean
  movimiento: MovimientoFinanciero | null
  clubes: Club[]
  onClose: () => void
  onSave: () => void
}

export default function MovimientoFormDialog({
  open,
  movimiento,
  clubes,
  onClose,
  onSave,
}: MovimientoFormDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: msg }))
  const clearFieldError = (field: string) =>
    setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next })

  // Campos del formulario
  const [tipo, setTipo] = useState<TipoMovimiento>('ingreso')
  const [categoria, setCategoria] = useState<CategoriaMovimiento>('otro')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString())
  const [origenClubId, setOrigenClubId] = useState('')
  const [origenEntidad, setOrigenEntidad] = useState('')
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobanteUrl, setComprobanteUrl] = useState('')
  const [comprobanteNombre, setComprobanteNombre] = useState('')

  // Inicializar campos cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      if (movimiento) {
        // Modo edición
        setTipo(movimiento.tipo)
        setCategoria(movimiento.categoria)
        setMonto(movimiento.monto.toString())
        setConcepto(movimiento.concepto)
        setDescripcion(movimiento.descripcion || '')
        setFecha(movimiento.created_at)
        setOrigenClubId(movimiento.origen_club_id || '')
        setOrigenEntidad(movimiento.origen_entidad || '')
        setComprobanteUrl(movimiento.comprobante_url || '')
        setComprobanteNombre(movimiento.comprobante_nombre || '')
      } else {
        // Modo creación
        resetForm()
      }
      setError(null)
    }
  }, [open, movimiento])

  const resetForm = () => {
    setTipo('ingreso')
    setCategoria('otro')
    setMonto('')
    setConcepto('')
    setDescripcion('')
    setFecha(new Date().toISOString())
    setOrigenClubId('')
    setOrigenEntidad('')
    setComprobanteFile(null)
    setComprobanteUrl('')
    setComprobanteNombre('')
    setFieldErrors({})
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setComprobanteFile(file)
    setError(null)
  }

  const handleSubmit = async () => {
    // Validar todos los campos requeridos
    const newErrors: Record<string, string> = {}
    if (!concepto.trim()) newErrors.concepto = 'El concepto es requerido'
    if (!monto || parseFloat(monto) <= 0) newErrors.monto = 'El monto debe ser mayor a 0'
    if (requiereClub && !origenClubId) newErrors.origenClubId = 'Debe seleccionar un club de origen'
    if (requiereEntidad && !origenEntidad.trim()) newErrors.origenEntidad = 'Debe especificar la entidad de origen'

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...newErrors }))
      return
    }

    setLoading(true)
    setError(null)

    try {
      let finalComprobanteUrl = comprobanteUrl
      let finalComprobanteNombre = comprobanteNombre

      // Si hay un archivo seleccionado pero no se ha subido, subirlo ahora
      if (comprobanteFile && user) {
        setUploadingFile(true)
        const timestamp = Date.now()
        const fileName = `${timestamp}_${comprobanteFile.name}`
        const path = `comprobantes/${user.id}/${fileName}`

        const uploadResult = await storageService.uploadFile(
          comprobanteFile,
          'comprobantes-financieros',
          path
        )

        if (uploadResult.success && uploadResult.url) {
          finalComprobanteUrl = uploadResult.url
          finalComprobanteNombre = comprobanteFile.name
        } else {
          throw new Error(uploadResult.error || 'Error al subir el comprobante')
        }
        setUploadingFile(false)
      }

      const movimientoData: MovimientoFinancieroInput = {
        tipo,
        categoria,
        monto: parseFloat(monto),
        concepto: concepto.trim(),
        descripcion: descripcion.trim() || undefined,
        fecha: movimiento ? fecha : new Date().toISOString(),
        origen_club_id: requiereClub ? (origenClubId || undefined) : undefined,
        origen_entidad: requiereEntidad ? (origenEntidad.trim() || undefined) : undefined,
        comprobante_url: finalComprobanteUrl || undefined,
        comprobante_nombre: finalComprobanteNombre || undefined,
        // @ts-ignore - Forzar estado inicial para evitar error de constraint en DB
        estado: 'registrado'
      }

      let response;
      if (movimiento) {
        // Actualizar
        response = await movimientoFinancieroController.updateMovimiento(movimiento.id, movimientoData)
      } else {
        // Crear
        if (!user?.id) {
          throw new Error('Usuario no autenticado')
        }
        response = await movimientoFinancieroController.createMovimiento(movimientoData, user.id)
      }

      if (response.success) {
        onSave()
        onClose()
      } else {
        setError(response.error || 'Error al guardar el movimiento')
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el movimiento')
    } finally {
      setLoading(false)
      setUploadingFile(false)
    }
  }

  const categoriasDisponibles = movimientoFinancieroController.getCategoriasPorTipo(tipo)

  const requiereClub = categoria === 'donacion_club' || categoria === 'pago_club'
  const requiereEntidad = categoria === 'aporte_estado' || categoria === 'sponsor'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {movimiento ? 'Editar Movimiento Financiero' : 'Nuevo Movimiento Financiero'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Tipo */}
          <Autocomplete
            fullWidth
            options={[
              { value: 'ingreso' as TipoMovimiento, label: 'Ingreso' },
              { value: 'egreso' as TipoMovimiento, label: 'Egreso' },
            ]}
            getOptionLabel={(opt) => opt.label}
            value={[
              { value: 'ingreso' as TipoMovimiento, label: 'Ingreso' },
              { value: 'egreso' as TipoMovimiento, label: 'Egreso' },
            ].find(o => o.value === tipo)!}
            onChange={(_, newVal) => {
              if (newVal) {
                setTipo(newVal.value)
                setCategoria('otro')
              }
            }}
            disableClearable
            renderInput={(params) => (
              <TextField {...params} label="Tipo" required />
            )}
          />

          {/* Categoría */}
          <Autocomplete
            fullWidth
            options={categoriasDisponibles.map(cat => ({
              value: cat as CategoriaMovimiento,
              label: movimientoFinancieroController.getCategoriaLabel(cat),
            }))}
            getOptionLabel={(opt) => opt.label}
            value={categoriasDisponibles.map(cat => ({
              value: cat as CategoriaMovimiento,
              label: movimientoFinancieroController.getCategoriaLabel(cat),
            })).find(o => o.value === categoria)!}
            onChange={(_, newVal) => {
              if (newVal) setCategoria(newVal.value)
            }}
            disableClearable
            renderInput={(params) => (
              <TextField {...params} label="Categoría" required />
            )}
          />

          {/* Concepto */}
          <TextField
            label="Concepto"
            fullWidth
            required
            value={concepto}
            onChange={(e) => { setConcepto(e.target.value); clearFieldError('concepto') }}
            onBlur={() => { if (!concepto.trim()) setFieldError('concepto', 'El concepto es requerido') }}
            error={!!fieldErrors.concepto}
            helperText={fieldErrors.concepto}
          />

          {/* Descripción */}
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          {/* Monto */}
          <TextField
            label="Monto"
            type="number"
            fullWidth
            required
            value={monto}
            onChange={(e) => { setMonto(e.target.value); clearFieldError('monto') }}
            onBlur={() => {
              if (!monto || parseFloat(monto) <= 0) setFieldError('monto', 'El monto debe ser mayor a 0')
            }}
            error={!!fieldErrors.monto}
            helperText={fieldErrors.monto}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>Bs.</Typography>,
            }}
          />

          {/* Fecha */}
          <DateTimePicker
            label="Fecha"
            value={fecha ? dayjs(fecha) : null}
            onChange={(newValue) => {
              setFecha(newValue ? newValue.toISOString() : '')
            }}
            disabled
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                helperText: 'Se registra automáticamente con la hora actual',
              },
            }}
            format="DD/MM/YYYY HH:mm"
          />

          {/* Club de origen (solo si es necesario) */}
          {requiereClub && (
            <Autocomplete
              fullWidth
              options={[...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club))}
              getOptionLabel={(club) => club.nombre_club}
              value={clubes.find(c => c.id === origenClubId) ?? null}
              onChange={(_, newVal) => { setOrigenClubId(newVal?.id ?? ''); clearFieldError('origenClubId') }}
              onBlur={() => { if (!origenClubId) setFieldError('origenClubId', 'Debe seleccionar un club de origen') }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Club de Origen"
                  required
                  error={!!fieldErrors.origenClubId}
                  helperText={fieldErrors.origenClubId}
                />
              )}
            />
          )}

          {/* Entidad de origen (solo si es necesario) */}
          {requiereEntidad && (
            <TextField
              label="Entidad de Origen"
              fullWidth
              required
              value={origenEntidad}
              onChange={(e) => { setOrigenEntidad(e.target.value); clearFieldError('origenEntidad') }}
              onBlur={() => { if (!origenEntidad.trim()) setFieldError('origenEntidad', 'Debe especificar la entidad de origen') }}
              error={!!fieldErrors.origenEntidad}
              helperText={fieldErrors.origenEntidad}
            />
          )}

          {/* Upload de comprobante */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Comprobante (opcional)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={loading || uploadingFile}
                fullWidth
              >
                {comprobanteFile ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                <input
                  type="file"
                  hidden
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {comprobanteFile && (
                <Chip 
                  label={comprobanteFile.name} 
                  onDelete={() => setComprobanteFile(null)}
                  color="primary"
                  sx={{ alignSelf: 'flex-start' }}
                />
              )}
              {comprobanteUrl && !comprobanteFile && (
                <Chip
                  icon={<AttachFileIcon />}
                  label={comprobanteNombre || 'Comprobante adjunto'}
                  color="success"
                  variant="outlined"
                  onDelete={() => {
                    setComprobanteUrl('')
                    setComprobanteNombre('')
                  }}
                  sx={{ alignSelf: 'flex-start' }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || uploadingFile}>
          {loading ? <CircularProgress size={24} /> : movimiento ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
