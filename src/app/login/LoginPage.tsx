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
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials } from '@/models/auth'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/schemas/globales'
import { FormInput } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const { user, signIn, isAuthenticated, loading: authLoading } = useAuth()

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { control, handleSubmit } = form

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
      setLoading(false)
    } catch (err) {
      setError('Error inesperado al iniciar sesión')
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

          <FormProvider {...form}>
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: '100%', mt: 1 }}
            >
              <FormInput
                control={control}
                name="email"
                label="Email"
                margin="normal"
                fullWidth
                id="email"
                autoComplete="email"
                disabled={loading}
              />

              <FormInput
                control={control}
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                fullWidth
                id="password"
                autoComplete="current-password"
                disabled={loading}
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: '48px' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  href="/reset-password"
                  variant="body2"
                  sx={{ cursor: 'pointer' }}
                >
                  Olvidaste tu contraseña?
                </Link>
              </Box>
            </Box>
          </FormProvider>
        </Paper>
      </Container>
    </Box>
  )
}
