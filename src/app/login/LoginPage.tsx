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
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials } from '@/models/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/utils/zodSchemas'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isAuthenticated, loading: authLoading } = useAuth()
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      if (user?.debe_cambiar_password) {
        router.push('/cambiar-password')
      } else {
        router.push('/')
      }
    }
  }, [mounted, isAuthenticated, authLoading, user, router])

  const onSubmit = async (data: LoginCredentials) => {
    setError(null)
    setLoading(true)

    try {
      const response = await signIn(data)
      
      if (response.success && response.data) {
        if (response.data.user.debe_cambiar_password) {
          router.push('/cambiar-password')
        } else {
          router.push('/')
        }
      } else {
        setError(response.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  // No renderizar Material UI hasta que esté montado en el cliente (evitar hidratación)
  if (!mounted) {
    return null
  }

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <Box
        suppressHydrationWarning
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // No mostrar el formulario si ya está autenticado (se redirigirá)
  if (isAuthenticated) {
    return null
  }

  return (
    <Box
      suppressHydrationWarning
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Iniciar Sesión
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sistema de Gestión - Asociación de Judo
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ width: '100%', mt: 1 }}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  id="email"
                  label="Email"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  disabled={loading}
                  error={!!errors.password}
                  helperText={errors.password?.message}
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
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                href="/reset-password"
                variant="body2"
                sx={{ cursor: 'pointer' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

