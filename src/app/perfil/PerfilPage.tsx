'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Badge,
  IconButton,
  InputAdornment,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LockIcon from '@mui/icons-material/Lock'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { authController } from '@/controllers/authController'
import { createClient } from '@/lib/supabase/client'

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
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [successPassword, setSuccessPassword] = useState<string | null>(null)
  const [errorPassword, setErrorPassword] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (user) {
      // Obtener nombres y apellidos directamente del objeto user
      // Si el backend devuelve el nombre completo en 'nombres', intentamos usar 'nombre' de la BD si estuviera disponible
      // Pero basándonos en la interfaz User, usamos lo que tenemos
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
        // Actualizar el contexto global para que el avatar se vea en el sidebar inmediatamente
        await refreshUser()
        
        // Precargar la imagen antes de mostrarla y el mensaje de éxito
        const img = new Image()
        img.onload = () => {
          setAvatarUrl(response.data!)
          setUploading(false)
          setSuccess('Foto de perfil actualizada correctamente')
        }
        img.onerror = () => {
          setAvatarUrl(response.data!)
          setUploading(false)
          setSuccess('Foto de perfil actualizada correctamente')
        }
        img.src = response.data
      } else {
        setError(response.error || 'Error al subir la imagen')
        setUploading(false)
      }
    } catch (error) {
      console.error('Error al subir avatar:', error)
      setError('Error inesperado al subir la imagen')
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

  const handleChangePassword = async () => {
    setErrorPassword(null)
    setSuccessPassword(null)

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorPassword('Todos los campos son requeridos')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorPassword('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 8) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordRegex.test(newPassword)) {
      setErrorPassword('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
      return
    }

    setLoadingPassword(true)

    try {
      const supabase = createClient()
      
      // 1. Verificar la contraseña actual intentando iniciar sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      })

      if (signInError) {
        setErrorPassword('La contraseña actual es incorrecta')
        setLoadingPassword(false)
        return
      }

      // 2. Si el inicio de sesión fue exitoso, actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setErrorPassword(updateError.message || 'Error al cambiar la contraseña')
      } else {
        setSuccessPassword('Contraseña actualizada correctamente')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      setErrorPassword('Error inesperado al cambiar la contraseña')
    } finally {
      setLoadingPassword(false)
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
          <Typography variant="h4" component="h1" gutterBottom>
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
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                </Box>
              </Box>

              <Box mb={4}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Información de Cuenta
                </Typography>
                <Divider sx={{ mb: 4 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                </Box>
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

            {/* Sección de cambio de contraseña */}
            <Box mt={5}>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                Cambiar Contraseña
              </Typography>
              <Divider sx={{ mb: 4 }} />

              {successPassword && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessPassword(null)}>
                  {successPassword}
                </Alert>
              )}

              {errorPassword && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorPassword(null)}>
                  {errorPassword}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Contraseña Actual"
                  type={showCurrentPassword ? 'text' : 'password'}
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setErrorPassword(null)
                    setSuccessPassword(null)
                  }}
                  disabled={loadingPassword}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle current password visibility"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Nueva Contraseña"
                  type={showNewPassword ? 'text' : 'password'}
                  fullWidth
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setErrorPassword(null)
                    setSuccessPassword(null)
                  }}
                  disabled={loadingPassword}
                  helperText="Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirmar Nueva Contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrorPassword(null)
                    setSuccessPassword(null)
                  }}
                  disabled={loadingPassword}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={loadingPassword ? <CircularProgress size={20} /> : <LockIcon />}
                  onClick={handleChangePassword}
                  disabled={loadingPassword}
                  sx={{ px: 5, py: 1.5, fontWeight: 600 }}
                >
                  {loadingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </Box>
            </Box>
          </Paper>
      </Layout>
    </ProtectedRoute>
  )
}

