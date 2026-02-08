'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'

interface ArbitroFormProps {
  arbitro?: Arbitro | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ArbitroForm({ arbitro, onSuccess, onCancel }: ArbitroFormProps) {
  const [formData, setFormData] = useState<ArbitroCreate | ArbitroUpdate>({
    usuario_id: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    password: '',
    fecha_nacimiento: null,
    numero_celular: '',
    ci: '',
    genero: '',
    nivel_arbitraje: '',
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (arbitro) {
      const ap = arbitro.apellidos?.trim().split(/\s+/) ?? []
      setFormData({
        nombres: arbitro.nombres,
        apellido_paterno: ap[0] ?? '',
        apellido_materno: ap.slice(1).join(' ') ?? '',
        email: arbitro.email || '',
        fecha_nacimiento: arbitro.fecha_nacimiento || null,
        numero_celular: arbitro.numero_celular || '',
        ci: arbitro.ci || '',
        genero: arbitro.genero || '',
        nivel_arbitraje: arbitro.nivel_arbitraje || '',
        activo: arbitro.activo
      })
    }
  }, [arbitro])

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

    if (submitted) setSubmitted(false)

    // Filtrar entrada de CI: hasta 7 números, opcionalmente un guion y hasta 3 letras
    if (name === 'ci') {
      const val = value.toUpperCase()
      if (/^\d{0,7}(-([A-Z]{0,3})?)?$/.test(val)) {
        setFormData(prev => ({ ...prev, ci: val }))
        setError(null)
        setSuccess(false)
      }
      return
    }

    // Filtrar entrada de celular: solo números, máximo 8
    if (name === 'numero_celular') {
      const filtered = value.replace(/[^0-9]/g, '').slice(0, 8)
      setFormData(prev => ({ ...prev, numero_celular: filtered }))
      setError(null)
      setSuccess(false)
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    if (!name) return
    if (submitted) setSubmitted(false)
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
    const paternoVal = (formData.apellido_paterno ?? '').trim()
    const maternoVal = (formData.apellido_materno ?? '').trim()
    if (!paternoVal && !maternoVal) {
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
      setError('Formato de CI inválido: 1234567-CB')
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
      
      if (arbitro) {
        // Actualizar - extraer solo los campos válidos para actualización
        const updateData: ArbitroUpdate = {
          nombres: formData.nombres,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          email: formData.email,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          numero_celular: formData.numero_celular || null,
          ci: formData.ci || null,
          genero: formData.genero || null,
          nivel_arbitraje: formData.nivel_arbitraje || null,
          certificacion_id: formData.certificacion_id || null,
          activo: formData.activo
        }
        response = await arbitroController.updateArbitro(arbitro.id, updateData)
      } else {
        // Crear - El servicio creará automáticamente el usuario y perfil
        // Validar email y password si se está creando un nuevo árbitro
        if (!formData.email || !formData.password) {
          setError('Email y contraseña son requeridos para crear un nuevo árbitro')
          setLoading(false)
          return
        }

        const createData: ArbitroCreate = {
          ...formData as ArbitroCreate,
          usuario_id: 'temp-user-id', // El servicio lo reemplazará automáticamente
          email: formData.email,
          password: formData.password,
          numero_celular: formData.numero_celular,
          ci: formData.ci,
          genero: formData.genero
        }
        response = await arbitroController.createArbitro(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el árbitro')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Helpers para errores individuales
  const ciValue = (formData.ci ?? '').trim()
  const ciError = submitted && (!ciValue || !validateCI(ciValue))
  const ciHelperText = submitted && !ciValue
    ? 'El Carnet de Identidad es requerido'
    : submitted && !validateCI(ciValue) && ciValue
      ? 'Formato: 1234567-CB'
      : ''
  const paterno = (formData.apellido_paterno ?? '').trim()
  const materno = (formData.apellido_materno ?? '').trim()
  const apellidoError = submitted && !paterno && !materno
  const celValue = (formData.numero_celular ?? '').trim()
  const celError = submitted && celValue.length > 0 && !validateCelular(celValue)
  const celHelperText = celError ? 'Debe tener exactamente 8 dígitos' : ''

  const emailValue = (formData.email ?? '').trim()
  const emailError = submitted && (!emailValue || !validateEmail(emailValue))
  const emailHelperText = submitted && !emailValue
    ? 'El email es requerido'
    : submitted && !validateEmail(emailValue) && emailValue
      ? 'El formato del email no es válido'
      : ''

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {arbitro ? 'Árbitro actualizado exitosamente' : 'Árbitro creado exitosamente'}
        </Alert>
      )}

      {/* Contenedor en columna para que todos los campos tengan mismo ancho y estén uno debajo del otro */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          label="Email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          required
          disabled={loading}
          error={emailError}
          helperText={emailHelperText}
        />

        {!arbitro && (
          <>
            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={handleChange}
              required
              disabled={loading}
              error={submitted && (!formData.password || formData.password.length < 8)}
              helperText={submitted && (!formData.password || formData.password.length < 8) ? "La contraseña debe tener al menos 8 caracteres" : ""}
              inputProps={{ minLength: 8 }}
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
          </>
        )}

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
            <MenuItem value="Femenino">Femenino</MenuItem>
            <MenuItem value="Masculino">Masculino</MenuItem>
            <MenuItem value="Prefiero no decir">Prefiero no decir</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Nivel de Arbitraje</InputLabel>
          <Select
            name="nivel_arbitraje"
            value={formData.nivel_arbitraje || ''}
            onChange={handleSelectChange}
            disabled={loading}
            label="Nivel de Arbitraje"
          >
            <MenuItem value="">
              <em>Sin definir</em>
            </MenuItem>
            <MenuItem value="Regional">Regional</MenuItem>
            <MenuItem value="Nacional">Nacional</MenuItem>
            <MenuItem value="Internacional">Internacional</MenuItem>
          </Select>
        </FormControl>

        {/* TODO: Agregar campo para subir foto_perfil */}
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
          {loading ? 'Guardando...' : arbitro ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

