'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Paper,
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { authController } from '@/controllers/authController'
import { FormInput } from '@/components/ui'

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
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { control, handleSubmit } = useForm<CambiarPasswordFormData>({
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
      const verifyResponse = await authController.verifyCurrentPassword(user.email, data.currentPassword)
      if (!verifyResponse.success) {
        setError(verifyResponse.error || 'La contraseña actual es incorrecta')
        return
      }

      const response = await authController.completePasswordChange(data.newPassword, user.id)
      if (response.success) {
        setSuccess(true)
        await signOut()
        setTimeout(() => {
          router.push('/login')
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
            <FormInput
              control={control}
              name="currentPassword"
              label="Contraseña Actual"
              type={showCurrentPassword ? 'text' : 'password'}
              margin="normal"
              fullWidth
              disabled={loading || success}
              helperText='La contraseña que recibiste por correo (Judo.[Carnet])'
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
            <FormInput
              control={control}
              name="newPassword"
              label="Nueva Contraseña"
              type={showNewPassword ? 'text' : 'password'}
              margin="normal"
              fullWidth
              disabled={loading || success}
              helperText='Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número'
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
            <FormInput
              control={control}
              name="confirmPassword"
              label="Confirmar Nueva Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              margin="normal"
              fullWidth
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
