'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import { CARGOS_ASOCIACION } from '@/utils/constants'

interface MiembroAsociacionFormProps {
  miembro?: MiembroAsociacion | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function MiembroAsociacionForm({ miembro, onSuccess, onCancel }: MiembroAsociacionFormProps) {
  const [formData, setFormData] = useState<MiembroAsociacionCreate | MiembroAsociacionUpdate>({
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    password: '',
    cargo: '',
    fecha_nacimiento: null,
    numero_celular: '',
    ci: '',
    genero: '',
    fecha_ingreso: null,
    activo: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (miembro) {
      setFormData({
        nombres: miembro.nombres,
        apellido_paterno: miembro.apellido_paterno ?? miembro.apellidos?.split(/\s+/)[0] ?? '',
        apellido_materno: miembro.apellido_materno ?? miembro.apellidos?.split(/\s+/).slice(1).join(' ') ?? '',
        email: miembro.email,
        cargo: miembro.cargo ?? '',
        fecha_nacimiento: miembro.fecha_nacimiento || null,
        numero_celular: miembro.numero_celular || '',
        ci: miembro.ci || '',
        genero: miembro.genero || '',
        fecha_ingreso: miembro.fecha_ingreso || null,
        activo: miembro.activo,
      })
    }
  }, [miembro])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let response

      if (miembro) {
        const updateData: MiembroAsociacionUpdate = {
          nombres: formData.nombres,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          email: formData.email,
          cargo: formData.cargo || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          numero_celular: formData.numero_celular || null,
          ci: formData.ci || null,
          genero: formData.genero || null,
          fecha_ingreso: formData.fecha_ingreso || null,
          activo: formData.activo,
        }
        response = await asociacionController.updateMiembro(miembro.id, updateData)
      } else {
        const createData: MiembroAsociacionCreate = {
          nombres: formData.nombres || '',
          apellido_paterno: formData.apellido_paterno || '',
          apellido_materno: formData.apellido_materno || '',
          email: formData.email || '',
          password: formData.password || '',
          cargo: formData.cargo || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          numero_celular: formData.numero_celular || null,
          ci: formData.ci || null,
          genero: formData.genero || null,
          fecha_ingreso: formData.fecha_ingreso || null,
          activo: formData.activo ?? true,
        }
        response = await asociacionController.createMiembro(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el miembro')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {miembro ? 'Miembro actualizado exitosamente' : 'Miembro creado exitosamente'}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Nombres"
          name="nombres"
          value={formData.nombres}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Apellido paterno"
          name="apellido_paterno"
          value={formData.apellido_paterno ?? ''}
          onChange={handleChange}
          disabled={loading}
          helperText="Al menos uno de los dos apellidos es requerido"
        />
        <TextField
          fullWidth
          label="Apellido materno"
          name="apellido_materno"
          value={formData.apellido_materno ?? ''}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Fecha de Nacimiento"
          name="fecha_nacimiento"
          type="date"
          value={formData.fecha_nacimiento || ''}
          onChange={handleChange}
          disabled={loading}
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          fullWidth
          label="Carnet de Identidad"
          name="ci"
          value={formData.ci || ''}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Número de Celular"
          name="numero_celular"
          value={formData.numero_celular || ''}
          onChange={handleChange}
          disabled={loading}
        />

        <FormControl fullWidth>
          <InputLabel>Género</InputLabel>
          <Select
            name="genero"
            value={formData.genero || ''}
            onChange={handleSelectChange}
            disabled={loading}
            label="Género"
          >
            <MenuItem value="">
              <em>Sin definir</em>
            </MenuItem>
            <MenuItem value="Masculino">Masculino</MenuItem>
            <MenuItem value="Femenino">Femenino</MenuItem>
            <MenuItem value="Prefiero no decir">Prefiero no decir</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Fecha de Ingreso"
          name="fecha_ingreso"
          type="date"
          value={formData.fecha_ingreso || ''}
          onChange={handleChange}
          disabled={loading}
          InputLabelProps={{
            shrink: true,
          }}
        />

        <FormControl fullWidth required disabled={loading}>
          <InputLabel>Cargo</InputLabel>
          <Select
            name="cargo"
            value={formData.cargo ?? ''}
            label="Cargo"
            onChange={handleSelectChange}
          >
            {CARGOS_ASOCIACION.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
          helperText={!miembro ? "Email para iniciar sesión en el sistema" : ""}
        />

        {!miembro && (
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            helperText="Mínimo 8 caracteres"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : miembro ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

