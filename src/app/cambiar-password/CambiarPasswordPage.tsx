'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LockIcon from '@mui/icons-material/Lock'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { authController } from '@/controllers/authController'

const cambiarPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúscula, minúscula y número'),
  confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type CambiarPasswordFormData = z.infer<typeof cambiarPasswordSchema>

export default function CambiarPasswordPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<CambiarPasswordFormData>({
    resolver: zodResolver(cambiarPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirigir si no está autenticado o si ya cambió su contraseña
  useEffect(() => {
    if (mounted && !authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user && !user.debe_cambiar_password) {
        router.push('/')
      }
    }
  }, [mounted, isAuthenticated, authLoading, user, router])

  const onSubmit = async (data: CambiarPasswordFormData) => {
    if (!user) return
    setError(null)
    setLoading(true)

    try {
      // 1. Verificar la contraseña actual
      const verifyResponse = await authController.verifyCurrentPassword(user.email, data.currentPassword)
      if (!verifyResponse.success) {
        setError(verifyResponse.error || 'La contraseña actual es incorrecta')
        return
      }

      // 2. Proceder con el cambio de contraseña y actualización del flag
      const response = await authController.completePasswordChange(data.newPassword, user.id)
      if (response.success) {
        setSuccess(true)
        await refreshUser()
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(response.error || 'Error al cambiar la contraseña')
      }
    } catch {
      setError('Error inesperado al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated || (user && !user.debe_cambiar_password)) {
    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LockIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom align="center">
            Cambio de Contraseña Obligatorio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Por seguridad, debes cambiar tu contraseña inicial antes de continuar.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Contraseña actualizada correctamente. Redirigiendo...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', mt: 1 }}>
            <Controller
              name="currentPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Contraseña Actual"
                  type={showCurrentPassword ? 'text' : 'password'}
                  disabled={loading || success}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message || 'La contraseña que recibiste por correo (Judo.[Carnet])'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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
              )}
            />
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Nueva Contraseña"
                  type={showNewPassword ? 'text' : 'password'}
                  disabled={loading || success}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message || 'Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  disabled={loading || success}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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
              )}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}


export default function CambiarPasswordPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirigir si no está autenticado o si ya cambió su contraseña
  useEffect(() => {
    if (mounted && !authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user && !user.debe_cambiar_password) {
        router.push('/')
      }
    }
  }, [mounted, isAuthenticated, authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son requeridos')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordRegex.test(newPassword)) {
      setError('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
      return
    }

    setLoading(true)

    try {
      if (!user) return

      const supabase = createClient()
      
      // 1. Verificar la contraseña actual intentando iniciar sesión de nuevo (re-autenticación)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        setError('La contraseña actual es incorrecta')
        setLoading(false)
        return
      }

      // 2. Proceder con el cambio de contraseña y actualización del flag
      const response = await authController.completePasswordChange(newPassword, user.id)
      
      if (response.success) {
        setSuccess(true)
        await refreshUser()
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(response.error || 'Error al cambiar la contraseña')
      }
    } catch (err) {
      setError('Error inesperado al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated || (user && !user.debe_cambiar_password)) {
    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LockIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom align="center">
            Cambio de Contraseña Obligatorio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Por seguridad, debes cambiar tu contraseña inicial antes de continuar.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Contraseña actualizada correctamente. Redirigiendo...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Contraseña Actual"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading || success}
              helperText="La contraseña que recibiste por correo (Judo.[Carnet])"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
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
              margin="normal"
              fullWidth
              label="Nueva Contraseña"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading || success}
              helperText="Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
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
              margin="normal"
              fullWidth
              label="Confirmar Nueva Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || success}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
