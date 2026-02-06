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
  Typography,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Club, ClubCreate, ClubUpdate } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { Sensei, SenseiCreate } from '@/models/sensei'
import { PROVINCIAS } from '@/utils/constants'

interface ClubFormProps {
  club?: Club | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ClubForm({ club, onSuccess, onCancel }: ClubFormProps) {
  const [formData, setFormData] = useState<ClubCreate | ClubUpdate>({
    nombre_club: '',
    provincia: '',
    direccion: '',
    telefono_contacto: '',
    director_tecnico_id: null,
    activo: true
  })
  const [senseis, setSenseis] = useState<Sensei[]>([])
  const [newDirectorNombres, setNewDirectorNombres] = useState('')
  const [newDirectorApellidos, setNewDirectorApellidos] = useState('')
  const [newDirectorEmail, setNewDirectorEmail] = useState('')
  const [newDirectorPassword, setNewDirectorPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSenseis, setLoadingSenseis] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isCreatingNewDirector, setIsCreatingNewDirector] = useState(false)

  useEffect(() => {
    // Cargar senseis activos
    const loadSenseis = async () => {
      const response = await senseiController.getAllSenseis(false)
      if (response.success && response.data) {
        // Si estamos editando un club, filtrar solo senseis del club o sin club
        if (club) {
          const senseisDisponibles = response.data.filter(
            sensei => sensei.club_id === club.id || sensei.club_id === null
          )
          setSenseis(senseisDisponibles)
        } else {
          // Si estamos creando un club nuevo, mostrar solo senseis sin club
          const senseisSinClub = response.data.filter(
            sensei => sensei.club_id === null
          )
          setSenseis(senseisSinClub)
        }
      }
      setLoadingSenseis(false)
    }
    loadSenseis()
  }, [club])

  useEffect(() => {
    if (club) {
      setFormData({
        nombre_club: club.nombre_club,
        provincia: club.provincia || '',
        direccion: club.direccion || '',
        telefono_contacto: club.telefono_contacto || '',
        director_tecnico_id: club.director_tecnico_id || null,
        activo: club.activo
      })
      // Al editar un club no usamos los campos de nuevo director
      setNewDirectorNombres('')
      setNewDirectorApellidos('')
      setNewDirectorEmail('')
      setNewDirectorPassword('')
    }
  }, [club])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
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
      let directorTecnicoId = formData.director_tecnico_id || null
      let createdSenseiId: string | null = null

      // Si estamos creando un club y no hay director seleccionado,
      // pero sí se ingresó nombre y apellido, crear automáticamente un Sensei como Encargado
      if (
        !club &&
        !directorTecnicoId &&
        newDirectorNombres.trim() !== '' &&
        newDirectorApellidos.trim() !== ''
      ) {
        // Validar email y password para el nuevo director técnico
        if (!newDirectorEmail.trim() || !newDirectorPassword.trim()) {
          setError('Email y contraseña son requeridos para crear un nuevo Director Técnico')
          setLoading(false)
          return
        }

        const senseiToCreate: SenseiCreate = {
          usuario_id: 'temp-user-id', // el servicio creará el usuario real
          nombres: newDirectorNombres.trim(),
          apellidos: newDirectorApellidos.trim(),
          email: newDirectorEmail.trim(),
          password: newDirectorPassword.trim(),
          isEncargado: true, // Marcar como encargado para asignar el rol correcto
          activo: true
          // No asignamos club_id aquí porque el club aún no existe
        }

        const senseiResponse = await senseiController.createSensei(senseiToCreate)

        if (!senseiResponse.success || !senseiResponse.data) {
          const errorMessage = senseiResponse.error || 'Error al crear el director técnico (sensei)'
          setError(errorMessage)
          setLoading(false)
          return
        }

        // Guardamos el ID del sensei creado para actualizarlo después con el club_id
        createdSenseiId = senseiResponse.data.id

        // En la tabla clubes guardamos el id de user_profiles,
        // que coincide con usuario_id del sensei
        directorTecnicoId = senseiResponse.data.usuario_id
      }

      const clubPayload: ClubCreate = {
        ...(formData as ClubCreate),
        director_tecnico_id: directorTecnicoId
      }

      if (club) {
        // Actualizar
        response = await clubController.updateClub(club.id, clubPayload)
      } else {
        // Crear
        response = await clubController.createClub(clubPayload)

        // Si se creó un sensei nuevo y el club se creó exitosamente,
        // actualizar el sensei con el club_id del club recién creado
        if (response.success && response.data && createdSenseiId) {
          const updateSenseiResponse = await senseiController.updateSensei(
            createdSenseiId,
            { club_id: response.data.id }
          )

          if (!updateSenseiResponse.success) {
            // No fallamos la creación del club, solo mostramos un warning
            console.warn('Club creado pero no se pudo asociar al sensei:', updateSenseiResponse.error)
          }
        }
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        setError(response.error || 'Error al guardar el club')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado'
      setError(errorMessage)
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
          {club ? 'Club actualizado exitosamente' : 'Club creado exitosamente'}
        </Alert>
      )}

      {/* Contenedor en columna para que todos los campos ocupen el mismo ancho */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Nombre del Club"
          name="nombre_club"
          value={formData.nombre_club}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <FormControl fullWidth disabled={loading}>
          <InputLabel>Provincia</InputLabel>
          <Select
            name="provincia"
            value={formData.provincia ?? ''}
            label="Provincia"
            onChange={(e: SelectChangeEvent<string>) =>
              setFormData(prev => ({ ...prev, provincia: e.target.value }))
            }
          >
            {PROVINCIAS.map(p => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Dirección"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          multiline
          rows={3}
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Teléfono de Contacto"
          name="telefono_contacto"
          value={formData.telefono_contacto}
          onChange={handleChange}
          disabled={loading}
        />

        {/* Sección de Director Técnico */}
        {!club && (
          <Box sx={{ mt: 1 }}>
            {!isCreatingNewDirector ? (
              // Modo: Seleccionar director técnico existente
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Director Técnico</InputLabel>
                  <Select
                    name="director_tecnico_id"
                    value={formData.director_tecnico_id || ''}
                    onChange={handleSelectChange}
                    disabled={loading || loadingSenseis}
                    label="Director Técnico"
                  >
                    <MenuItem value="">
                      <em>Sin director técnico</em>
                    </MenuItem>
                    {senseis.map((sensei) => (
                      <MenuItem key={sensei.id} value={sensei.usuario_id}>
                        {sensei.nombres} {sensei.apellidos}
                        {sensei.grado_dan && ` - ${sensei.grado_dan}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setIsCreatingNewDirector(true)
                    setFormData(prev => ({ ...prev, director_tecnico_id: null }))
                  }}
                  disabled={loading}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Crear Nuevo Director Técnico
                </Button>
              </Box>
            ) : (
              // Modo: Crear nuevo director técnico
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Nuevo Director Técnico
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => {
                      setIsCreatingNewDirector(false)
                      setNewDirectorNombres('')
                      setNewDirectorApellidos('')
                      setNewDirectorEmail('')
                      setNewDirectorPassword('')
                    }}
                    disabled={loading}
                  >
                    Seleccionar Existente
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mb: 1 }}>
                  El director técnico se registrará como encargado automáticamente
                </Alert>

                <TextField
                  fullWidth
                  label="Nombre del Director Técnico"
                  name="nuevo_director_nombres"
                  value={newDirectorNombres}
                  onChange={(e) => {
                    setNewDirectorNombres(e.target.value)
                    setError(null)
                    setSuccess(false)
                  }}
                  disabled={loading}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Apellidos del Director Técnico"
                  name="nuevo_director_apellidos"
                  value={newDirectorApellidos}
                  onChange={(e) => {
                    setNewDirectorApellidos(e.target.value)
                    setError(null)
                    setSuccess(false)
                  }}
                  disabled={loading}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Email del Director Técnico"
                  name="nuevo_director_email"
                  type="email"
                  value={newDirectorEmail}
                  onChange={(e) => {
                    setNewDirectorEmail(e.target.value)
                    setError(null)
                    setSuccess(false)
                  }}
                  disabled={loading}
                  required
                  helperText="Email para iniciar sesión en el sistema"
                />
                
                <TextField
                  fullWidth
                  label="Contraseña del Director Técnico"
                  name="nuevo_director_password"
                  type={showPassword ? 'text' : 'password'}
                  value={newDirectorPassword}
                  onChange={(e) => {
                    setNewDirectorPassword(e.target.value)
                    setError(null)
                    setSuccess(false)
                  }}
                  disabled={loading}
                  required
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
                  helperText="Mínimo 8 caracteres"
                  inputProps={{ minLength: 8 }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Al editar, solo mostrar el selector */}
        {club && (
          <FormControl fullWidth>
            <InputLabel>Director Técnico</InputLabel>
            <Select
              name="director_tecnico_id"
              value={formData.director_tecnico_id || ''}
              onChange={handleSelectChange}
              disabled={loading || loadingSenseis}
              label="Director Técnico"
            >
              <MenuItem value="">
                <em>Sin director técnico</em>
              </MenuItem>
              {senseis.map((sensei) => (
                <MenuItem key={sensei.id} value={sensei.usuario_id}>
                  {sensei.nombres} {sensei.apellidos}
                  {sensei.grado_dan && ` - ${sensei.grado_dan}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          {loading ? 'Guardando...' : club ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

