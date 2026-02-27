'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
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
import { authController } from '@/controllers/authController'
import { createClient } from '@/lib/supabase/client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { requestResetSchema, resetPasswordSchema } from '@/utils/zodSchemas'

export default function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  
  // Formulario para solicitud
  const {
    control: controlRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest },
    reset: resetRequest,
  } = useForm({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  })

  // Formulario para restablecimiento
  const {
    control: controlReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Verificar si hay un token en la URL (cuando el usuario viene del email)
  useEffect(() => {
    const checkSession = async () => {
      if (typeof window === 'undefined') return

      try {
        // Verificar errores en query params primero
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          setCheckingToken(false)
          if (errorParam === 'otp_expired' || errorParam === 'access_denied') {
            setError('El enlace de recuperación ha expirado o no es válido. Por favor solicita uno nuevo.')
          } else {
            setError(errorDescription || 'Error al procesar el enlace de recuperación. Por favor solicita uno nuevo.')
          }
          // Limpiar la URL
          window.history.replaceState(null, '', '/reset-password')
          return
        }

        const supabase = createClient()

        // IMPORTANTE: El intercambio de código ahora se maneja en /auth/callback
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStep('reset')
          setCheckingToken(false)
          return
        }

        const code = searchParams.get('code')
        if (code) {
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (!exchangeError && data.session) {
              setStep('reset')
              setCheckingToken(false)
              window.history.replaceState(null, '', '/reset-password')
              return
            }
          } catch (fallbackError) {
            console.error('Error en fallback:', fallbackError)
          }
        }

        // Verificar si hay hash en la URL (flujo legacy)
        const hash = window.location.hash
        if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: { session: sessionFromHash } } = await supabase.auth.getSession()
          
          if (sessionFromHash) {
            setStep('reset')
            window.history.replaceState(null, '', '/reset-password')
            setCheckingToken(false)
            return
          }
        }

        setCheckingToken(false)
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        setCheckingToken(false)
      }
    }

    checkSession()
  }, [searchParams])

  const onResetRequest = async (data: { email: string }) => {
    setError(null)
    setLoading(true)

    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : '/auth/callback?next=/reset-password'

      const response = await authController.resetPassword(data.email, redirectUrl)
      
      if (response.success) {
        setSuccess(true)
        resetRequest()
      } else {
        setError(response.error || 'Error al enviar el email de recuperación')
      }
    } catch (err) {
      console.error('Error al solicitar recuperación:', err)
      setError('Error inesperado al solicitar recuperación de contraseña')
    } finally {
      setLoading(false)
    }
  }

  const onResetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
    setError(null)
    setLoading(true)

    try {
      const response = await authController.updatePassword(data.password)
      
      if (response.success) {
        setSuccess(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        setError(response.error || 'Error al actualizar la contraseña')
      }
    } catch (err) {
      console.error('Error al actualizar contraseña:', err)
      setError('Error inesperado al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      window.location.href = '/login'
    }
  }

  if (checkingToken) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Verificando enlace de recuperación...
            </Typography>
          </Paper>
        </Container>
      </Box>
    )
  }

  if (step === 'request') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h4" gutterBottom>
              Recuperar Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </Typography>

            {success && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                Se ha enviado un email con las instrucciones para restablecer tu contraseña.
              </Alert>
            )}

            {error && (
              <Alert 
                severity="error" 
                sx={{ width: '100%', mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={() => { setError(null); resetRequest(); }}>
                    Intentar de nuevo
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmitRequest(onResetRequest)} sx={{ width: '100%', mt: 1 }}>
              <Controller
                name="email"
                control={controlRequest}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Email"
                    autoComplete="email"
                    disabled={loading || success}
                    error={!!errorsRequest.email}
                    helperText={errorsRequest.email?.message}
                  />
                )}
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading || success}>
                {loading ? <CircularProgress size={24} /> : 'Enviar Email de Recuperación'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link component="button" type="button" variant="body2" onClick={handleBackToLogin} sx={{ cursor: 'pointer' }}>
                  Volver al inicio de sesión
                </Link>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Restablecer Contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Ingresa tu nueva contraseña
          </Typography>

          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Tu contraseña ha sido actualizada correctamente. Redirigiendo...
            </Alert>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => { setError(null); setStep('request'); router.push('/reset-password'); }}>
                  Solicitar nuevo enlace
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmitReset(onResetPassword)} sx={{ width: '100%', mt: 1 }}>
            <Controller
              name="password"
              control={controlReset}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Nueva Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  disabled={loading || success}
                  error={!!errorsReset.password}
                  helperText={errorsReset.password?.message || "Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número"}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} onMouseDown={(e) => e.preventDefault()} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={controlReset}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  disabled={loading || success}
                  error={!!errorsReset.confirmPassword}
                  helperText={errorsReset.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="toggle confirm password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} onMouseDown={(e) => e.preventDefault()} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading || success}>
              {loading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component="button" type="button" variant="body2" onClick={handleBackToLogin} sx={{ cursor: 'pointer' }}>
                Volver al inicio de sesión
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
