'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PersonIcon from '@mui/icons-material/Person'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { authController } from '@/controllers/authController'

export default function PerfilPage() {
  const { user, refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    rol: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        rol: user.rol || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar mensajes al escribir
    if (success) setSuccess(null)
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await authController.updateProfile(user.id, {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
      })

      if (response.success) {
        setSuccess('Perfil actualizado correctamente')
        await refreshUser() // Actualizar el contexto global
      } else {
        setError(response.error || 'Error al actualizar el perfil')
      }
    } catch (err) {
      console.error('Error al guardar perfil:', err)
      setError('Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (rol: string) => {
    const roles: Record<string, string> = {
      asociacion: 'Asociación',
      sensei: 'Sensei',
      encargado: 'Encargado',
      arbitro: 'Árbitro',
      judoka: 'Judoka'
    }
    return roles[rol] || rol
  }

  if (!user) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
            <PersonIcon sx={{ mr: 2, fontSize: 40 }} color="primary" />
            Mi Perfil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tu información personal
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información Personal
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombres"
                  name="nombres"
                  fullWidth
                  required
                  value={formData.nombres}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Apellidos"
                  name="apellidos"
                  fullWidth
                  required
                  value={formData.apellidos}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Información de Cuenta
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Correo Electrónico"
                  fullWidth
                  value={formData.email}
                  disabled
                  helperText="El correo electrónico no se puede modificar"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Rol"
                  fullWidth
                  value={getRoleLabel(formData.rol)}
                  disabled
                  helperText="Tu rol en el sistema"
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Layout>
    </ProtectedRoute>
  )
}

