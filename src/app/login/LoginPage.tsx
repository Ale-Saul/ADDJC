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
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials } from '@/models/auth'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isAuthenticated, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      router.push('/')
    }
  }, [mounted, isAuthenticated, authLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await signIn(formData)
      
      if (response.success) {
        router.push('/')
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
            onSubmit={handleSubmit}
            sx={{ width: '100%', mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
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

