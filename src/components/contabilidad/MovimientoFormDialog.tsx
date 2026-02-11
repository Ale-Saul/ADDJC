import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
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

  // Campos del formulario
  const [tipo, setTipo] = useState<TipoMovimiento>('ingreso')
  const [categoria, setCategoria] = useState<CategoriaMovimiento>('otro')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
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
        setFecha(movimiento.fecha.split('T')[0])
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
    setFecha(new Date().toISOString().split('T')[0])
    setOrigenClubId('')
    setOrigenEntidad('')
    setComprobanteFile(null)
    setComprobanteUrl('')
    setComprobanteNombre('')
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setComprobanteFile(file)
    setError(null)
  }

  const handleUploadFile = async () => {
    if (!comprobanteFile || !user) return

    setUploadingFile(true)
    setError(null)

    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}_${comprobanteFile.name}`
      const path = `comprobantes/${user.id}/${fileName}`

      const result = await storageService.uploadFile(
        comprobanteFile,
        'comprobantes-financieros',
        path
      )

      if (result.success && result.url) {
        // Guardar el path en lugar de la URL completa
        // Esto funciona tanto para buckets públicos como privados
        setComprobanteUrl(result.url)
        setComprobanteNombre(comprobanteFile.name)
        setComprobanteFile(null)
      } else {
        setError(result.error || 'Error al subir el archivo')
      }
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!concepto.trim()) {
      setError('El concepto es requerido')
      return
    }

    if (!monto || parseFloat(monto) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    // Validar campos específicos según categoría
    if ((categoria === 'donacion_club' || categoria === 'pago_club') && !origenClubId) {
      setError('Debe seleccionar un club de origen')
      return
    }

    if (categoria === 'aporte_estado' && !origenEntidad.trim()) {
      setError('Debe especificar la entidad de origen')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const movimientoData: MovimientoFinancieroInput = {
        tipo,
        categoria,
        monto: parseFloat(monto),
        concepto: concepto.trim(),
        descripcion: descripcion.trim() || undefined,
        fecha,
        origen_club_id: origenClubId || undefined,
        origen_entidad: origenEntidad.trim() || undefined,
        comprobante_url: comprobanteUrl || undefined,
        comprobante_nombre: comprobanteNombre || undefined,
      }

      if (movimiento) {
        // Actualizar
        await movimientoFinancieroController.updateMovimiento(movimiento.id, movimientoData)
      } else {
        // Crear
        if (!user?.id) {
          throw new Error('Usuario no autenticado')
        }
        await movimientoFinancieroController.createMovimiento(movimientoData, user.id)
      }

      onSave()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el movimiento')
    } finally {
      setLoading(false)
    }
  }

  const categoriasDisponibles = movimientoFinancieroController.getCategoriasPorTipo(tipo)

  const requiereClub = categoria === 'donacion_club' || categoria === 'pago_club'
  const requiereEntidad = categoria === 'aporte_estado'

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
          <FormControl fullWidth required>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={tipo}
              label="Tipo"
              onChange={(e) => {
                setTipo(e.target.value as TipoMovimiento)
                setCategoria('otro')
              }}
            >
              <MenuItem value="ingreso">Ingreso</MenuItem>
              <MenuItem value="egreso">Egreso</MenuItem>
            </Select>
          </FormControl>

          {/* Categoría */}
          <FormControl fullWidth required>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={categoria}
              label="Categoría"
              onChange={(e) => setCategoria(e.target.value as CategoriaMovimiento)}
            >
              {categoriasDisponibles.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {movimientoFinancieroController.getCategoriaLabel(cat)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Concepto */}
          <TextField
            label="Concepto"
            fullWidth
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Título breve del movimiento"
          />

          {/* Descripción */}
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción detallada del movimiento (opcional)"
          />

          {/* Monto */}
          <TextField
            label="Monto"
            type="number"
            fullWidth
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>Bs.</Typography>,
            }}
          />

          {/* Fecha */}
          <DatePicker
            label="Fecha"
            value={fecha ? dayjs(fecha) : null}
            onChange={(newValue) => {
              setFecha(newValue ? newValue.format('YYYY-MM-DD') : '')
            }}
            disabled={loading}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
            format="DD/MM/YYYY"
          />

          {/* Club de origen (solo si es necesario) */}
          {requiereClub && (
            <FormControl fullWidth required>
              <InputLabel>Club de Origen</InputLabel>
              <Select
                value={origenClubId}
                label="Club de Origen"
                onChange={(e) => setOrigenClubId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Seleccionar club</em>
                </MenuItem>
                {clubes.map((club) => (
                  <MenuItem key={club.id} value={club.id}>
                    {club.nombre_club}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Entidad de origen (solo si es necesario) */}
          {requiereEntidad && (
            <TextField
              label="Entidad de Origen"
              fullWidth
              required
              value={origenEntidad}
              onChange={(e) => setOrigenEntidad(e.target.value)}
              placeholder="Nombre de la entidad (ej: Ministerio del Deporte)"
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
                disabled={uploadingFile}
                fullWidth
              >
                Seleccionar Archivo
                <input
                  type="file"
                  hidden
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {comprobanteFile && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip 
                    label={comprobanteFile.name} 
                    onDelete={() => setComprobanteFile(null)}
                    sx={{ alignSelf: 'flex-start' }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleUploadFile}
                    disabled={uploadingFile}
                    fullWidth
                  >
                    {uploadingFile ? 'Subiendo...' : 'Subir Archivo'}
                  </Button>
                </Box>
              )}
              {comprobanteUrl && !comprobanteFile && (
                <Chip
                  icon={<AttachFileIcon />}
                  label={comprobanteNombre || 'Comprobante adjunto'}
                  color="success"
                  variant="outlined"
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
