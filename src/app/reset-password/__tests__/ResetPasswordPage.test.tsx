import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ResetPasswordPage from '../ResetPasswordPage'
import { authController } from '@/controllers/authController'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// Mocks
jest.mock('@/controllers/authController')
jest.mock('@/lib/supabase/client')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockAuthController = authController as jest.Mocked<typeof authController>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('ResetPasswordPage', () => {
  let mockSupabase: any
  let mockRouter: any
  let mockSearchParamsInstance: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockRouter = {
      push: jest.fn(),
    }

    mockSearchParamsInstance = {
      get: jest.fn(),
    }

    mockUseRouter.mockReturnValue(mockRouter)
    mockUseSearchParams.mockReturnValue(mockSearchParamsInstance as any)

    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        exchangeCodeForSession: jest.fn(),
        setSession: jest.fn(),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    }

    mockCreateClient.mockReturnValue(mockSupabase)

    // Mock window.location
    delete (window as any).location
    window.location = { 
      href: '',
      hash: '',
      origin: 'http://localhost:3000'
    } as any
  })

  describe('Paso de solicitud de recuperación', () => {
    it('debe renderizar el formulario de solicitud', async () => {
      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument()
      })

      expect(screen.getByText(/Ingresa tu email y te enviaremos un enlace/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Enviar Email de Recuperación/i })).toBeInTheDocument()
    })

    it('debe enviar email de recuperación exitosamente', async () => {
      mockAuthController.resetPassword.mockResolvedValue({ success: true })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/Email/i)
      await userEvent.type(emailInput, 'test@example.com')

      fireEvent.submit(screen.getByRole('button', { name: /Enviar Email de Recuperación/i }))

      await waitFor(() => {
        expect(mockAuthController.resetPassword).toHaveBeenCalledWith(
          'test@example.com',
          'http://localhost:3000/auth/callback?next=/reset-password'
        )
      }, { timeout: 15000 })

      expect(await screen.findByText(/Se ha enviado un email/i, {}, { timeout: 15000 })).toBeInTheDocument()
    }, 20000)

    it('debe mostrar error al fallar el envío', async () => {
      mockAuthController.resetPassword.mockResolvedValue({ 
        success: false, 
        error: 'Email no encontrado' 
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/Email/i)
      await userEvent.type(emailInput, 'invalid@example.com')

      fireEvent.submit(screen.getByRole('button', { name: /Enviar Email de Recuperación/i }))

      expect(await screen.findByText(/Email no encontrado/i, {}, { timeout: 15000 })).toBeInTheDocument()
    }, 20000)

    it('debe deshabilitar el formulario durante el envío', async () => {
      let resolveReset: (value: any) => void
      const resetPromise = new Promise(resolve => {
        resolveReset = resolve
      })

      mockAuthController.resetPassword.mockImplementation(() => resetPromise)

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/Email/i)
      await userEvent.type(emailInput, 'test@example.com')

      fireEvent.submit(screen.getByRole('button', { name: /Enviar Email de Recuperación/i }))

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(screen.getByLabelText(/Email/i)).toBeDisabled()

      resolveReset!({ success: true })
    }, 20000)

    it('debe tener enlace para volver al login', async () => {
      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText(/Volver al inicio de sesión/i)).toBeInTheDocument()
      })

      const backLink = screen.getByText(/Volver al inicio de sesión/i)
      await userEvent.click(backLink)

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      }, { timeout: 10000 })
    }, 20000)
  })

  describe('Paso de cambio de contraseña', () => {
    beforeEach(() => {
      // Simular que hay una sesión activa (usuario viene del email)
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '123' } } }
      })
    })

    it('debe mostrar formulario de cambio de contraseña con sesión activa', async () => {
      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      })

      expect(screen.getByTestId('password')).toBeInTheDocument()
      expect(screen.getByTestId('confirmPassword')).toBeInTheDocument()
    })

    it('debe cambiar contraseña exitosamente', async () => {
      mockAuthController.updatePassword.mockResolvedValue({ success: true })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByTestId('password')
      const confirmInput = screen.getByTestId('confirmPassword')

      await userEvent.type(passwordInput, 'NewPassword123')
      await userEvent.type(confirmInput, 'NewPassword123')

      const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAuthController.updatePassword).toHaveBeenCalledWith('NewPassword123')
      })

      expect(await screen.findByText(/contraseña ha sido actualizada correctamente/i)).toBeInTheDocument()
    })

    it('debe validar que las contraseñas coincidan', async () => {
      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByTestId('password')
      const confirmInput = screen.getByTestId('confirmPassword')

      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmInput, 'Different123')

      const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument()
      })

      expect(mockAuthController.updatePassword).not.toHaveBeenCalled()
    })

    it('debe validar longitud mínima de contraseña', async () => {
      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByTestId('password')
      const confirmInput = screen.getByTestId('confirmPassword')

      await userEvent.type(passwordInput, 'Short1')
      await userEvent.type(confirmInput, 'Short1')

      const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/debe tener al menos 8 caracteres/i)).toBeInTheDocument()
      })

      expect(mockAuthController.updatePassword).not.toHaveBeenCalled()
    })

    it('debe validar complejidad de contraseña', async () => {
      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByTestId('password')
      const confirmInput = screen.getByTestId('confirmPassword')

      await userEvent.type(passwordInput, 'alllowercase')
      await userEvent.type(confirmInput, 'alllowercase')

      const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos una mayúscula, una minúscula y un número/i)).toBeInTheDocument()
      })

      expect(mockAuthController.updatePassword).not.toHaveBeenCalled()
    })

    it('debe mostrar error al fallar el cambio', async () => {
      mockAuthController.updatePassword.mockResolvedValue({ 
        success: false, 
        error: 'Error al actualizar contraseña' 
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByTestId('password')
      const confirmInput = screen.getByTestId('confirmPassword')

      await userEvent.type(passwordInput, 'NewPassword123')
      await userEvent.type(confirmInput, 'NewPassword123')

      const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
      await userEvent.click(submitButton)

      expect(await screen.findByText(/Error al actualizar contraseña/i)).toBeInTheDocument()
    })
  })

  describe('Manejo de errores en URL', () => {
    it('debe mostrar error cuando el token ha expirado', async () => {
      mockSearchParamsInstance.get.mockImplementation((key: string) => {
        if (key === 'error') return 'otp_expired'
        return null
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText(/enlace de recuperación ha expirado/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('debe mostrar error cuando el acceso es denegado', async () => {
      mockSearchParamsInstance.get.mockImplementation((key: string) => {
        if (key === 'error') return 'access_denied'
        return null
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText(/enlace de recuperación ha expirado o no es válido/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('debe mostrar descripción de error personalizada', async () => {
      mockSearchParamsInstance.get.mockImplementation((key: string) => {
        if (key === 'error') return 'custom_error'
        if (key === 'error_description') return 'Descripción del error personalizada'
        return null
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText(/Descripción del error personalizada/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })

  describe('Procesamiento de código PKCE', () => {
    it('debe intercambiar código por sesión', async () => {
      mockSearchParamsInstance.get.mockImplementation((key: string) => {
        if (key === 'code') return 'auth_code_123'
        return null
      })

      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '123' } } },
        error: null,
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth_code_123')
      }, { timeout: 10000 })

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('debe manejar error en intercambio de código', async () => {
      mockSearchParamsInstance.get.mockImplementation((key: string) => {
        if (key === 'code') return 'invalid_code'
        return null
      })

      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid code' },
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })

  describe('Procesamiento de hash legacy', () => {
    it('debe procesar hash con access_token', async () => {
      window.location.hash = '#access_token=token123&refresh_token=refresh123&type=recovery'

      mockSupabase.auth.getSession
        .mockResolvedValueOnce({ data: { session: null } })
        .mockResolvedValueOnce({ 
          data: { session: { access_token: 'token123', user: { id: '123' } } } 
        })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('debe usar setSession como fallback para hash', async () => {
      window.location.hash = '#access_token=token123&refresh_token=refresh123&type=recovery'

      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: { access_token: 'token123', user: { id: '123' } } },
        error: null,
      })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
          access_token: 'token123',
          refresh_token: 'refresh123',
        })
      }, { timeout: 10000 })
    })
  })

  describe('Estado de carga', () => {
    it('debe mostrar indicador de carga al verificar token', () => {
      // Mantener la promesa pendiente
      mockSupabase.auth.getSession.mockImplementation(() => new Promise(() => {}))

      render(<ResetPasswordPage />)

      expect(screen.getByText(/Verificando enlace de recuperación/i)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Redirección después del éxito', () => {
    beforeEach(() => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '123' } } }
      })
    })

    it('debe cerrar sesión y mostrar éxito después de cambiar contraseña', async () => {
      mockAuthController.updatePassword.mockResolvedValue({ success: true })

      render(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByTestId('password')
      const confirmInput = screen.getByTestId('confirmPassword')

      await userEvent.type(passwordInput, 'NewPassword123')
      await userEvent.type(confirmInput, 'NewPassword123')

      const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAuthController.updatePassword).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText(/contraseña ha sido actualizada correctamente/i)).toBeInTheDocument()
      })

      // Verificar que se cierra la sesión antes de redirigir
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })
})
