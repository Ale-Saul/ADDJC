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
  MenuItem
} from '@mui/material'
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
    apellidos: '',
    fecha_nacimiento: null,
    nivel_arbitraje: '',
    certificacion: '',
    foto_perfil: null,
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (arbitro) {
      setFormData({
        nombres: arbitro.nombres,
        apellidos: arbitro.apellidos,
        fecha_nacimiento: arbitro.fecha_nacimiento || null,
        nivel_arbitraje: arbitro.nivel_arbitraje || '',
        certificacion: arbitro.certificacion || '',
        foto_perfil: arbitro.foto_perfil || null,
        activo: arbitro.activo
      })
    }
  }, [arbitro])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      if (arbitro) {
        // Actualizar
        response = await arbitroController.updateArbitro(arbitro.id, formData)
      } else {
        // Crear - El servicio creará automáticamente el usuario y perfil
        const createData: ArbitroCreate = {
          ...formData as ArbitroCreate,
          usuario_id: 'temp-user-id' // El servicio lo reemplazará automáticamente
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
          disabled={loading}
          InputLabelProps={{
            shrink: true,
          }}
        />

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

        <TextField
          fullWidth
          label="Certificación"
          name="certificacion"
          value={formData.certificacion || ''}
          onChange={handleChange}
          multiline
          rows={3}
          disabled={loading}
          placeholder="Detalles sobre la certificación del árbitro"
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
          {loading ? 'Guardando...' : arbitro ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  )
}

