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
  Avatar,
  Badge,
  IconButton,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PersonIcon from '@mui/icons-material/Person'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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
      setAvatarUrl(user.avatar_url || null)
    }
  }, [user])

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }
      
      if (!user) return

      const file = event.target.files[0]
      
      // Validaciones básicas antes de enviar
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar los 2MB')
        return
      }

      setUploading(true)
      setError(null)
      setSuccess(null)

      const response = await authController.uploadAvatar(user.id, file)
      
      if (response.success && response.data) {
        setAvatarUrl(response.data)
        await refreshUser()
        setSuccess('Foto de perfil actualizada correctamente')
      } else {
        setError(response.error || 'Error al subir la imagen')
      }
    } catch (error) {
      console.error('Error al subir avatar:', error)
      setError('Error inesperado al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

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

          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 3, sm: 4, md: 5 }, 
              maxWidth: 1000, 
              mx: 'auto', 
              borderRadius: 2,
              backgroundColor: 'background.paper'
            }}
          >
            <form onSubmit={handleSubmit}>
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

              <Box display="flex" justifyContent="center" mb={5}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      component="label"
                      disabled={uploading}
                      sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        border: '3px solid white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        width: 40,
                        height: 40,
                        boxShadow: 2
                      }}
                    >
                      <input 
                        hidden 
                        accept="image/*" 
                        type="file" 
                        onChange={handleAvatarChange} 
                      />
                      {uploading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <PhotoCameraIcon sx={{ fontSize: 20 }} />
                      )}
                    </IconButton>
                  }
                >
                  <Avatar 
                    src={avatarUrl || undefined}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      fontSize: '3rem',
                      bgcolor: 'primary.main',
                      border: '4px solid white',
                      boxShadow: 3
                    }}
                  >
                    {formData.nombres.charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
              </Box>

              <Box mb={4}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Información Personal
                </Typography>
                <Divider sx={{ mb: 4 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nombres"
                      name="nombres"
                      fullWidth
                      required
                      value={formData.nombres}
                      onChange={handleChange}
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
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
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box mb={4}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Información de Cuenta
                </Typography>
                <Divider sx={{ mb: 4 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Correo Electrónico"
                      fullWidth
                      value={formData.email}
                      disabled
                      variant="outlined"
                      helperText="Este campo no se puede modificar"
                      InputProps={{
                        readOnly: true,
                        sx: { 
                          bgcolor: 'grey.100',
                          '&.Mui-disabled': {
                            bgcolor: 'grey.100',
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Rol"
                      fullWidth
                      value={getRoleLabel(formData.rol)}
                      disabled
                      variant="outlined"
                      helperText="Asignado por el administrador"
                      InputProps={{
                        readOnly: true,
                        sx: { 
                          bgcolor: 'grey.100',
                          '&.Mui-disabled': {
                            bgcolor: 'grey.100',
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                  sx={{ 
                    px: 5, 
                    py: 1.5,
                    fontWeight: 600,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                    }
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </form>
          </Paper>
      </Layout>
    </ProtectedRoute>
  )
}

