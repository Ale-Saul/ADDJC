'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { Club } from '@/models/club'
import { Sensei } from '@/models/sensei'
import { useAuth } from '@/contexts/AuthContext'

interface JudokaFormProps {
  judoka?: Judoka | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function JudokaForm({ judoka, onSuccess, onCancel }: JudokaFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<JudokaCreate | JudokaUpdate>({
    usuario_id: '',
    club_id: null,
    entrenador_id: null,
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    password: '',
    fecha_nacimiento: '',
    numero_celular: '',
    ci: '',
    genero: '',
    categoria: '',
    peso_competitivo: null,
    cinturon_actual: '',
    activo: true
  })
  const [clubes, setClubes] = useState<Club[]>([])
  const [senseis, setSenseis] = useState<Sensei[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
  const [loadingSenseis, setLoadingSenseis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Opciones ordenadas alfabéticamente
  const sortedClubes = [...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club))
  const sortedSenseis = [...senseis].sort((a, b) => {
    const nameA = (a.nombres + ' ' + (a.apellidos || '')).trim()
    const nameB = (b.nombres + ' ' + (b.apellidos || '')).trim()
    return nameA.localeCompare(nameB)
  })
  const generos = ["Masculino", "Femenino", "Prefiero no decir"].sort((a, b) => a.localeCompare(b))
  const categorias = ["Preinfantil", "Infantil", "Cadete", "Junior", "Senior"]
  const cinturones = ["Blanco", "Amarillo", "Naranja", "Verde", "Azul", "Café", "Negro"]

  useEffect(() => {
    // Cargar clubes activos
    const loadClubes = async () => {
      const response = await clubController.getAllClubes(false)
      if (response.success && response.data) {
        setClubes(response.data)
      }
      setLoadingClubes(false)
    }
    loadClubes()
  }, [])

  // Cargar senseis cuando se selecciona un club
  useEffect(() => {
    const loadSenseis = async () => {
      if (formData.club_id) {
        setLoadingSenseis(true)
        const response = await senseiController.getSenseisByClub(formData.club_id)
        if (response.success && response.data) {
          setSenseis(response.data)
        } else {
          setSenseis([])
        }
        setLoadingSenseis(false)
      } else {
        setSenseis([])
        setFormData(prev => ({ ...prev, entrenador_id: null }))
      }
    }
    loadSenseis()
  }, [formData.club_id])

  useEffect(() => {
    if (judoka) {
      const ap = judoka.apellido_paterno ?? judoka.apellidos?.trim().split(/\s+/)[0] ?? ''
      const am = judoka.apellido_materno ?? judoka.apellidos?.trim().split(/\s+/).slice(1).join(' ') ?? ''
      setFormData({
        ...judoka,
        club_id: judoka.club_id || null,
        entrenador_id: judoka.entrenador_id || null,
        nombres: judoka.nombres || '',
        apellido_paterno: ap,
        apellido_materno: am,
        email: judoka.email || '',
        fecha_nacimiento: judoka.fecha_nacimiento || '',
        numero_celular: judoka.numero_celular || '',
        ci: judoka.ci || '',
        genero: judoka.genero || '',
        categoria: judoka.categoria || '',
        peso_competitivo: judoka.peso_competitivo || null,
        cinturon_actual: judoka.cinturon_actual || '',
        activo: judoka.activo
      })
    }
  }, [judoka])

  // Si es un sensei o encargado creando un nuevo judoka, pre-completar el club
  useEffect(() => {
    if (!judoka && user && user.club_id) {
      if (user.rol === 'sensei') {
        // Sensei: pre-completar club y entrenador (él mismo)
        setFormData(prev => ({
          ...prev,
          club_id: user.club_id,
          entrenador_id: user.id
        }))
      } else if (user.rol === 'encargado') {
        // Encargado: solo pre-completar club, puede elegir el entrenador
        setFormData(prev => ({
          ...prev,
          club_id: user.club_id
        }))
      }
    }
  }, [judoka, user])

  const validateEmail = (email: string) => {
    if (!email) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateCI = (ci: string) => {
    if (!ci) return false
    return /^\d{1,7}(-[A-Z]{1,3})?$/.test(ci)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (submitted) setSubmitted(false)
    
    // Validación de CI
    if (name === 'ci') {
      const val = value.toUpperCase()
      if (/^\d{0,7}(-([A-Z]{0,3})?)?$/.test(val)) {
        setFormData(prev => ({ ...prev, [name]: val }))
        setError(null)
      }
      return
    } 

    // Validación de celular (8 números)
    if (name === 'numero_celular') {
      const filtered = value.replace(/[^0-9]/g, '').slice(0, 8)
      setFormData(prev => ({ ...prev, [name]: filtered }))
      setError(null)
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? (name === 'nombres' || name === 'apellido_paterno' || name === 'apellido_materno' ? '' : null) : value
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
      [name]: value === '' ? null : value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    // Validaciones
    const names = (formData.nombres ?? '').trim()
    const paterno = (formData.apellido_paterno ?? '').trim()
    const materno = (formData.apellido_materno ?? '').trim()
    const ci = (formData.ci ?? '').trim()
    const email = (formData.email ?? '').trim()
    const cel = (formData.numero_celular ?? '').trim()

    if (!ci || !validateCI(ci)) {
      setError(!ci ? 'El Carnet de Identidad es requerido' : 'Formato de CI inválido: 1234567-CB')
      return
    }

    if (!names) {
      setError('El nombre es obligatorio')
      return
    }

    if (!paterno && !materno) {
      setError('Se requiere al menos un apellido')
      return
    }

    if (email && !validateEmail(email)) {
      setError('Email inválido')
      return
    }

    if (cel && cel.length !== 8) {
      setError('El número de celular debe tener exactamente 8 dígitos')
      return
    }

    if (!judoka) {
      if (!email) {
        setError('El email es obligatorio para nuevos judokas')
        return
      }
      if (!formData.password || formData.password.length < 8) {
        setError('La contraseña es obligatoria y debe tener al menos 8 caracteres')
        return
      }
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let response
      
      if (judoka) {
        // Actualizar
        const updateData: JudokaUpdate = {
          club_id: formData.club_id || null,
          entrenador_id: formData.entrenador_id || null,
          nombres: names,
          apellido_paterno: paterno,
          apellido_materno: materno,
          email: email || undefined,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          numero_celular: cel || null,
          ci: ci || null,
          genero: formData.genero || null,
          categoria: formData.categoria || null,
          peso_competitivo: formData.peso_competitivo || null,
          cinturon_actual: formData.cinturon_actual || null,
          activo: formData.activo
        }
        response = await judokaController.updateJudoka(judoka.id, updateData)
      } else {
        // Crear
        const createData: JudokaCreate = {
          ...formData as JudokaCreate,
          usuario_id: 'temp-user-id', 
          nombres: names,
          apellido_paterno: paterno,
          apellido_materno: materno,
          email: email || undefined,
          password: 'password' in formData ? formData.password : undefined,
          fecha_nacimiento: formData.fecha_nacimiento || '',
          numero_celular: cel || null,
          ci: ci,
          genero: formData.genero
        }
        response = await judokaController.createJudoka(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 500)
        }
      } else {
        setError(response.error || 'Error al guardar el judoka')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const paternoVal = (formData.apellido_paterno ?? '').trim()
  const maternoVal = (formData.apellido_materno ?? '').trim()
  const apellidoError = submitted && !paternoVal && !maternoVal
  const ciVal = (formData.ci ?? '').trim()
  const ciError = submitted && (!ciVal || !validateCI(ciVal))
  const emailVal = (formData.email ?? '').trim()
  const emailError = submitted && emailVal && !validateEmail(emailVal)
  const celVal = (formData.numero_celular ?? '').trim()
  const celError = submitted && celVal && celVal.length !== 8

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {judoka ? 'Judoka actualizado exitosamente' : 'Judoka creado exitosamente'}
        </Alert>
      )}

      {/* Contenedor en columna para que todos los campos tengan mismo ancho y estén uno debajo del otro */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Club</InputLabel>
          <Select
            name="club_id"
            value={formData.club_id || ''}
            onChange={handleSelectChange}
            disabled={loading || loadingClubes || user?.rol === 'sensei' || user?.rol === 'encargado'}
            label="Club"
          >
            <MenuItem value="">
              <em>Sin club</em>
            </MenuItem>
            {sortedClubes.map((club) => (
              <MenuItem key={club.id} value={club.id}>
                {club.nombre_club}
              </MenuItem>
            ))}
          </Select>
          {(user?.rol === 'sensei' || user?.rol === 'encargado') && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Los judokas se crearán automáticamente en tu club
            </Typography>
          )}
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Entrenador</InputLabel>
          <Select
            name="entrenador_id"
            value={formData.entrenador_id || ''}
            onChange={handleSelectChange}
            disabled={loading || loadingSenseis || !formData.club_id || user?.rol === 'sensei'}
            label="Entrenador"
          >
            <MenuItem value="">
              <em>Sin entrenador</em>
            </MenuItem>
            {sortedSenseis.map((sensei) => (
              <MenuItem key={sensei.id} value={sensei.id}>
                {sensei.nombres} {sensei.apellidos}
              </MenuItem>
            ))}
          </Select>
          {user?.rol === 'sensei' ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Serás asignado automáticamente como entrenador
            </Typography>
          ) : !formData.club_id && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Selecciona un club primero para ver los entrenadores disponibles
            </Typography>
          )}
        </FormControl>

        <TextField
          fullWidth
          label="Carnet de Identidad"
          name="ci"
          value={formData.ci || ''}
          onChange={handleChange}
          disabled={loading}
          error={ciError}
          helperText={ciError ? (!ciVal ? 'El Carnet de Identidad es requerido' : 'Formato: 1234567-CB') : ''}
          required
        />

        <TextField
          fullWidth
          label="Nombres"
          name="nombres"
          value={formData.nombres}
          onChange={handleChange}
          required
          disabled={loading}
          error={submitted && !formData.nombres?.trim()}
          helperText={submitted && !formData.nombres?.trim() ? 'El nombre es obligatorio' : ''}
        />

        <TextField
          fullWidth
          label="Apellido paterno"
          name="apellido_paterno"
          value={'apellido_paterno' in formData ? (formData.apellido_paterno ?? '') : ''}
          onChange={handleChange}
          disabled={loading}
          error={apellidoError}
          helperText={apellidoError ? 'Debe proporcionar al menos un apellido' : ''}
        />
        <TextField
          fullWidth
          label="Apellido materno"
          name="apellido_materno"
          value={'apellido_materno' in formData ? (formData.apellido_materno ?? '') : ''}
          onChange={handleChange}
          disabled={loading}
          error={apellidoError}
        />

        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={'email' in formData ? (formData.email || '') : ''}
          onChange={handleChange}
          disabled={loading}
          error={emailError || (submitted && !judoka && !emailVal)}
          helperText={emailError ? 'Formato de email inválido' : (submitted && !judoka && !emailVal ? 'El email es obligatorio' : '')}
          required={!judoka}
        />

        {!judoka && (
          <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={'password' in formData ? (formData.password || '') : ''}
              onChange={handleChange}
              disabled={loading}
              required
              error={submitted && (!formData.password || formData.password.length < 8)}
              helperText={submitted && (!formData.password || formData.password.length < 8) ? "La contraseña es obligatoria (mínimo 8 caracteres)" : ""}
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
          helperText={celError ? 'Debe tener exactamente 8 dígitos' : ''}
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
            {generos.map(g => (
              <MenuItem key={g} value={g}>{g}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select
            name="categoria"
            value={formData.categoria || ''}
            onChange={handleSelectChange}
            disabled={loading}
            label="Categoría"
          >
            <MenuItem value="">
              <em>Sin definir</em>
            </MenuItem>
            {categorias.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Cinturón Actual</InputLabel>
          <Select
            name="cinturon_actual"
            value={formData.cinturon_actual || ''}
            onChange={handleSelectChange}
            disabled={loading}
            label="Cinturón Actual"
          >
            <MenuItem value="">
              <em>Sin definir</em>
            </MenuItem>
            {cinturones.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
          {loading ? 'Guardando...' : judoka ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

