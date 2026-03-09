'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { requestResetSchema, resetPasswordSchema } from '@/utils/zodSchemas'

export default function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const checkSession = useCallback(async () => {
    try {
      const errorParam = searchParams.get('error')
      if (errorParam) {
        setError(searchParams.get('error_description') || 'Error en el enlace de recuperación.')
        return
      }

      // Si venimos de un enlace de recuperación, Supabase pone un hash en la URL
      // o un código en los parámetros. El cliente de Supabase maneja el hash automáticamente.
      const sessionResponse = await authController.getSession()
      
      if (sessionResponse.success && sessionResponse.data) {
        setStep('reset')
      } else {
        // Si no hay sesión, intentamos ver si hay un código para intercambiar
        const code = searchParams.get('code')
        if (code) {
          const exchangeResponse = await authController.exchangeCodeForSession(code)
          if (exchangeResponse.success && exchangeResponse.data) {
            setStep('reset')
          }
        }
      }
    } catch (err) {
      console.error('Error checking session:', err)
    } finally {
      setCheckingToken(false)
    }
  }, [searchParams])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const onResetRequest = async (data: { email: string }) => {
    setError(null)
    setLoading(true)
    // Redirigir directamente a la página de restablecimiento después de usar el enlace
    // Usamos la URL base del sitio y la ruta /reset-password
    const baseUrl = window.location.origin
    const redirectUrl = `${baseUrl}/reset-password`

    try {
      const response = await authController.resetPassword(data.email, redirectUrl)
      if (response.success) {
        setSuccess(true)
        resetRequest()
      } else {
        setError(response.error || 'Error al enviar el email')
      }
    } catch (err) {
      setError('Error inesperado')
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
        await authController.signOut()
        setTimeout(() => { router.push('/login') }, 2000)
      } else {
        setError(response.error || 'Error al actualizar')
      }
    } catch (err) {
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = async () => {
    await authController.signOut()
    router.push('/login')
  }

  if (checkingToken) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          {step === 'request' ? 'Recuperar Contraseña' : 'Restablecer Contraseña'}
        </Typography>
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {step === 'request' 
              ? 'Email enviado. Revisa tu bandeja de entrada.' 
              : 'Contraseña actualizada. Redirigiendo...'}
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

        <Box component="form" 
          onSubmit={step === 'request' ? handleSubmitRequest(onResetRequest) : handleSubmitReset(onResetPassword)} 
          sx={{ width: '100%', mt: 1 }}
        >
          {step === 'request' ? (
            <Controller
              name="email"
              control={controlRequest}
              render={({ field }) => (
                <TextField {...field} margin="normal" fullWidth label="Email" disabled={loading || success} error={!!errorsRequest.email} helperText={errorsRequest.email?.message} />
              )}
            />
          ) : (
            <>
              <Controller
                name="password"
                control={controlReset}
                render={({ field }) => (
                  <TextField {...field} margin="normal" fullWidth label="Nueva Contraseña" type={showPassword ? 'text' : 'password'} disabled={loading || success} error={!!errorsReset.password} helperText={errorsReset.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
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
                  <TextField {...field} margin="normal" fullWidth label="Confirmar Contraseña" type={showConfirmPassword ? 'text' : 'password'} disabled={loading || success} error={!!errorsReset.confirmPassword} helperText={errorsReset.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </>
          )}
          
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, height: '48px' }} disabled={loading || success}>
            {loading ? <CircularProgress size={24} color="inherit" /> : (step === 'request' ? 'Enviar Email' : 'Cambiar Contraseña')}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component="button" type="button" variant="body2" onClick={handleBackToLogin}>
              Volver al inicio de sesión
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
