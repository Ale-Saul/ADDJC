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
  Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { Club } from '@/models/club'
import { Sensei } from '@/models/sensei'

interface JudokaFormProps {
  judoka?: Judoka | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function JudokaForm({ judoka, onSuccess, onCancel }: JudokaFormProps) {
  const [formData, setFormData] = useState<JudokaCreate | JudokaUpdate>({
    usuario_id: '',
    club_id: null,
    entrenador_id: null,
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    categoria: '',
    peso_competitivo: null,
    cinturon_actual: '',
    foto_perfil: null,
    activo: true
  })
  const [clubes, setClubes] = useState<Club[]>([])
  const [senseis, setSenseis] = useState<Sensei[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
  const [loadingSenseis, setLoadingSenseis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      setFormData({
        club_id: judoka.club_id || null,
        entrenador_id: judoka.entrenador_id || null,
        nombres: judoka.nombres,
        apellidos: judoka.apellidos,
        fecha_nacimiento: judoka.fecha_nacimiento || '',
        categoria: judoka.categoria || '',
        peso_competitivo: judoka.peso_competitivo || null,
        cinturon_actual: judoka.cinturon_actual || '',
        foto_perfil: judoka.foto_perfil || null,
        activo: judoka.activo
      })
    }
  }, [judoka])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : (name === 'peso_competitivo' ? parseFloat(value) || null : value)
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
      
      if (judoka) {
        // Actualizar
        response = await judokaController.updateJudoka(judoka.id, formData)
      } else {
        // Crear - El servicio creará automáticamente el usuario y perfil
        const createData: JudokaCreate = {
          ...formData as JudokaCreate,
          usuario_id: 'temp-user-id', // El servicio lo reemplazará automáticamente
          fecha_nacimiento: formData.fecha_nacimiento || '' // Asegurar que no sea null
        }
        response = await judokaController.createJudoka(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1000)
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

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
            disabled={loading || loadingClubes}
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
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Entrenador</InputLabel>
          <Select
            name="entrenador_id"
            value={formData.entrenador_id || ''}
            onChange={handleSelectChange}
            disabled={loading || loadingSenseis || !formData.club_id}
            label="Entrenador"
          >
            <MenuItem value="">
              <em>Sin entrenador</em>
            </MenuItem>
            {senseis.map((sensei) => (
              <MenuItem key={sensei.id} value={sensei.usuario_id}>
                {sensei.nombres} {sensei.apellidos}
              </MenuItem>
            ))}
          </Select>
          {!formData.club_id && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Selecciona un club primero para ver los entrenadores disponibles
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
          label="Apellidos"
          name="apellidos"
          value={formData.apellidos}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Fecha de Nacimiento"
          name="fecha_nacimiento"
          type="date"
          value={formData.fecha_nacimiento || ''}
          onChange={handleChange}
          required
          disabled={loading}
          InputLabelProps={{
            shrink: true,
          }}
        />

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
            <MenuItem value="Preinfantil">Preinfantil</MenuItem>
            <MenuItem value="Infantil">Infantil</MenuItem>
            <MenuItem value="Cadete">Cadete</MenuItem>
            <MenuItem value="Junior">Junior</MenuItem>
            <MenuItem value="Senior">Senior</MenuItem>
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
            <MenuItem value="Blanco">Blanco</MenuItem>
            <MenuItem value="Amarillo">Amarillo</MenuItem>
            <MenuItem value="Naranja">Naranja</MenuItem>
            <MenuItem value="Verde">Verde</MenuItem>
            <MenuItem value="Azul">Azul</MenuItem>
            <MenuItem value="Café">Café</MenuItem>
            <MenuItem value="Negro">Negro</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Peso Competitivo (kg)"
          name="peso_competitivo"
          type="number"
          value={formData.peso_competitivo || ''}
          onChange={handleChange}
          disabled={loading}
          inputProps={{ min: 0, max: 300, step: 0.1 }}
        />

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
          {loading ? 'Guardando...' : judoka ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

