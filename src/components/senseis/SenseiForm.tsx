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
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'
import { useAuth } from '@/contexts/AuthContext'
import { ESPECIALIDADES_SENSEI } from '@/utils/constants'

interface SenseiFormProps {
  sensei?: Sensei | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function SenseiForm({ sensei, onSuccess, onCancel }: SenseiFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<SenseiCreate | SenseiUpdate>({
    usuario_id: '',
    club_id: null,
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    password: '',
    fecha_nacimiento: null,
    numero_celular: '',
    genero: '',
    grado_dan: '',
    especialidad: '',
    activo: true,
    isEncargado: false
  })
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  useEffect(() => {
    if (sensei) {
      const apParts = sensei.apellidos?.trim().split(/\s+/) ?? []
      setFormData({
        club_id: sensei.club_id || null,
        nombres: sensei.nombres,
        apellido_paterno: apParts[0] ?? '',
        apellido_materno: apParts.slice(1).join(' ') ?? '',
        fecha_nacimiento: sensei.fecha_nacimiento || null,
        numero_celular: sensei.numero_celular || '',
        genero: sensei.genero || '',
        grado_dan: sensei.grado_dan || '',
        especialidad: sensei.especialidad || '',
        activo: sensei.activo
      })
    }
  }, [sensei])

  // Si es un encargado creando un nuevo sensei, pre-completar el club
  useEffect(() => {
    if (!sensei && user?.rol === 'encargado' && user.club_id) {
      setFormData(prev => ({
        ...prev,
        club_id: user.club_id
      }))
    }
  }, [sensei, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value || null
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    if (!name) return
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }))
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
      
      if (sensei) {
        // Actualizar - extraer solo los campos válidos para actualización
        const updateData: SenseiUpdate = {
          club_id: formData.club_id || null,
          nombres: formData.nombres,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          numero_celular: formData.numero_celular || null,
          genero: formData.genero || null,
          grado_dan: formData.grado_dan || null,
          certificacion_id: formData.certificacion_id || null,
          especialidad: formData.especialidad || null,
          activo: formData.activo
        }
        response = await senseiController.updateSensei(sensei.id, updateData)
      } else {
        // Crear - El servicio creará automáticamente el usuario y perfil
        // Validar email y password si se está creando un nuevo sensei
        if (!formData.email || !formData.password) {
          setError('Email y contraseña son requeridos para crear un nuevo sensei')
          setLoading(false)
          return
        }

        const createData: SenseiCreate = {
          ...formData as SenseiCreate,
          usuario_id: 'temp-user-id', // El servicio lo reemplazará automáticamente
          email: formData.email,
          password: formData.password,
          numero_celular: formData.numero_celular,
          genero: formData.genero
        }
        response = await senseiController.createSensei(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el sensei')
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
          {sensei ? 'Sensei actualizado exitosamente' : 'Sensei creado exitosamente'}
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
            disabled={loading || loadingClubes || user?.rol === 'encargado'}
            label="Club"
          >
            <MenuItem value="">
              <em>Sin club</em>
            </MenuItem>
            {clubes.map((club) => (
              <MenuItem key={club.id} value={club.id}>
                {club.nombre_club}
              </MenuItem>
            ))}
          </Select>
          {user?.rol === 'encargado' && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Los senseis se crearán automáticamente en tu club
            </Typography>
          )}
        </FormControl>

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
          required
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Apellido materno"
          name="apellido_materno"
          value={formData.apellido_materno ?? ''}
          onChange={handleChange}
          required
          disabled={loading}
        />

        {!sensei && (
          <>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
              disabled={loading}
              helperText="Email para iniciar sesión en el sistema"
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={handleChange}
              required
              disabled={loading}
              helperText="Mínimo 8 caracteres"
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

        <FormControl fullWidth>
          <InputLabel>Grado Dan</InputLabel>
          <Select
            name="grado_dan"
            value={formData.grado_dan || ''}
            onChange={handleSelectChange}
            disabled={loading}
            label="Grado Dan"
          >
            <MenuItem value="">
              <em>Sin definir</em>
            </MenuItem>
            <MenuItem value="1er Dan">1er Dan</MenuItem>
            <MenuItem value="2do Dan">2do Dan</MenuItem>
            <MenuItem value="3er Dan">3er Dan</MenuItem>
            <MenuItem value="4to Dan">4to Dan</MenuItem>
            <MenuItem value="5to Dan">5to Dan</MenuItem>
            <MenuItem value="6to Dan">6to Dan</MenuItem>
            <MenuItem value="7mo Dan">7mo Dan</MenuItem>
            <MenuItem value="8vo Dan">8vo Dan</MenuItem>
            <MenuItem value="9no Dan">9no Dan</MenuItem>
            <MenuItem value="10mo Dan">10mo Dan</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Especialidad</InputLabel>
          <Select
            name="especialidad"
            value={formData.especialidad || ''}
            onChange={handleSelectChange}
            disabled={loading}
            label="Especialidad"
          >
            <MenuItem value="">
              <em>Sin definir</em>
            </MenuItem>
            {ESPECIALIDADES_SENSEI.map(esp => (
              <MenuItem key={esp} value={esp}>{esp}</MenuItem>
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
          {loading ? 'Guardando...' : sensei ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

