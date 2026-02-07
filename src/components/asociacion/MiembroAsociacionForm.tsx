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
  const [submitted, setSubmitted] = useState(false)

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

  // Validación de CI: hasta 7 números, opcionalmente un guión y hasta 3 letras
  const validateCI = (ci: string): boolean => {
    if (!ci) return false
    return /^\d{1,7}(-[A-Za-z]{1,3})?$/.test(ci)
  }

  // Validación de celular: exactamente 8 dígitos
  const validateCelular = (cel: string): boolean => {
    if (!cel) return true // no es requerido
    return /^\d{8}$/.test(cel)
  }

  // Validación de email
  const validateEmail = (email: string): boolean => {
    if (!email) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Filtrar entrada de CI: solo números, guión y letras
    if (name === 'ci') {
      const filtered = value.replace(/[^0-9a-zA-Z-]/g, '')
      setFormData(prev => ({ ...prev, ci: filtered }))
      setError(null)
      setSuccess(false)
      return
    }

    // Filtrar entrada de celular: solo números
    if (name === 'numero_celular') {
      const filtered = value.replace(/[^0-9]/g, '').slice(0, 8)
      setFormData(prev => ({ ...prev, numero_celular: filtered }))
      setError(null)
      setSuccess(false)
      return
    }

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
    setSubmitted(true)
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validaciones del lado del cliente
    const paterno = (formData.apellido_paterno ?? '').trim()
    const materno = (formData.apellido_materno ?? '').trim()
    if (!paterno && !materno) {
      setError('Al menos uno de los dos apellidos es requerido')
      setLoading(false)
      return
    }

    const ciValue = (formData.ci ?? '').trim()
    if (!ciValue) {
      setError('El Carnet de Identidad es requerido')
      setLoading(false)
      return
    }
    if (!validateCI(ciValue)) {
      setError('El Carnet de Identidad debe tener hasta 7 números y opcionalmente un guión seguido de hasta 3 letras (ej: 1234567-CB)')
      setLoading(false)
      return
    }

    const celValue = (formData.numero_celular ?? '').trim()
    if (celValue && !validateCelular(celValue)) {
      setError('El número de celular debe tener exactamente 8 dígitos')
      setLoading(false)
      return
    }

    const emailValue = (formData.email ?? '').trim()
    if (!emailValue) {
      setError('El email es requerido')
      setLoading(false)
      return
    }
    if (!validateEmail(emailValue)) {
      setError('El formato del email no es válido')
      setLoading(false)
      return
    }

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

  // Helpers para mostrar errores en campos individuales
  const ciValue = (formData.ci ?? '').trim()
  const ciError = submitted && (!ciValue || !validateCI(ciValue))
  const ciHelperText = submitted && !ciValue
    ? 'El Carnet de Identidad es requerido'
    : submitted && !validateCI(ciValue) && ciValue
      ? 'Formato: hasta 7 números, opcionalmente guión y hasta 3 letras (ej: 1234567-CB)'
      : ''

  const celValue = (formData.numero_celular ?? '').trim()
  const celError = submitted && celValue.length > 0 && !validateCelular(celValue)
  const celHelperText = celError ? 'Debe tener exactamente 8 dígitos' : ''

  const emailValue = (formData.email ?? '').trim()
  const emailError = submitted && (!emailValue || !validateEmail(emailValue))
  const emailHelperText = submitted && !emailValue
    ? 'El email es requerido'
    : submitted && !validateEmail(emailValue) && emailValue
      ? 'El formato del email no es válido'
      : !miembro ? 'Email para iniciar sesión en el sistema' : ''

  const paterno = (formData.apellido_paterno ?? '').trim()
  const materno = (formData.apellido_materno ?? '').trim()
  const apellidoError = submitted && !paterno && !materno

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
        {/* CI como primer campo, requerido */}
        <TextField
          fullWidth
          label="Carnet de Identidad"
          name="ci"
          value={formData.ci || ''}
          onChange={handleChange}
          required
          disabled={loading}
          error={ciError}
          helperText={ciHelperText}
          placeholder="Ej: 1234567-CB"
        />

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
          error={apellidoError}
          helperText={apellidoError ? 'Al menos uno de los dos apellidos es requerido' : ''}
        />
        <TextField
          fullWidth
          label="Apellido materno"
          name="apellido_materno"
          value={formData.apellido_materno ?? ''}
          onChange={handleChange}
          disabled={loading}
          error={apellidoError}
          helperText={apellidoError ? 'Al menos uno de los dos apellidos es requerido' : ''}
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
          label="Número de Celular"
          name="numero_celular"
          value={formData.numero_celular || ''}
          onChange={handleChange}
          disabled={loading}
          error={celError}
          helperText={celHelperText}
          inputProps={{ maxLength: 8 }}
          placeholder="Ej: 71234567"
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

        {/* Cargo NO requerido */}
        <FormControl fullWidth disabled={loading}>
          <InputLabel>Cargo</InputLabel>
          <Select
            name="cargo"
            value={formData.cargo ?? ''}
            label="Cargo"
            onChange={handleSelectChange}
          >
            <MenuItem value="">
              <em>Sin cargo</em>
            </MenuItem>
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
          error={emailError}
          helperText={emailHelperText}
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
