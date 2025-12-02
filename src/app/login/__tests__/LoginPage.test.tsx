import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LoginPage from '../LoginPage'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Mock del contexto de autenticación
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock del router de Next.js
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('LoginPage', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
  const mockPush = jest.fn()
  const mockSignIn = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar el formulario de login correctamente', () => {
      render(<LoginPage />)

      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
      expect(screen.getByText(/¿olvidaste tu contraseña\?/i)).toBeInTheDocument()
    })

    it('debe mostrar el título y subtítulo correctos', () => {
      render(<LoginPage />)

      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
      expect(screen.getByText(/sistema de gestión - asociación de judo/i)).toBeInTheDocument()
    })

    it('debe tener un link a reset password', () => {
      render(<LoginPage />)

      const resetLink = screen.getByText(/¿olvidaste tu contraseña\?/i)
      expect(resetLink).toBeInTheDocument()
      expect(resetLink.closest('a')).toHaveAttribute('href', '/reset-password')
    })
  })

  describe('Interacción del usuario', () => {
    it('debe actualizar el campo de email al escribir', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement

      await user.type(emailInput, 'test@example.com')

      expect(emailInput.value).toBe('test@example.com')
    })

    it('debe actualizar el campo de contraseña al escribir', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement

      await user.type(passwordInput, 'password123')

      expect(passwordInput.value).toBe('password123')
    })

    it('debe limpiar el error al escribir en los campos', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({
        success: false,
        error: 'Credenciales inválidas',
      })

      render(<LoginPage />)

      // Llenar campos y enviar formulario para generar error
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })

      // Escribir en email debería limpiar el error
      await user.type(emailInput, 't')

      await waitFor(() => {
        expect(screen.queryByText(/credenciales inválidas/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Envío del formulario', () => {
    it('debe llamar a signIn con las credenciales correctas', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ success: true })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    it('debe redirigir a home después de un login exitoso', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ success: true })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('debe mostrar error si el login falla', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({
        success: false,
        error: 'Credenciales inválidas',
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error genérico si signIn lanza una excepción', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Network error'))

      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/error inesperado al iniciar sesión/i)).toBeInTheDocument()
      })
    })

    it('debe deshabilitar el formulario durante el envío', async () => {
      const user = userEvent.setup()
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Durante el loading, los inputs deben estar deshabilitados
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('debe mostrar indicador de carga durante el envío', async () => {
      const user = userEvent.setup()
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Debe haber un CircularProgress
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })
  })

  describe('Redirección si ya está autenticado', () => {
    it('debe redirigir a home si el usuario ya está autenticado', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: mockSignIn,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(<LoginPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('debe mostrar loading mientras verifica autenticación', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false,
        signIn: mockSignIn,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(<LoginPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('no debe mostrar el formulario si está autenticado', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: mockSignIn,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(<LoginPage />)

      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument()
    })
  })

  describe('Validación del formulario', () => {
    it('debe tener campos requeridos', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)

      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
    })

    it('debe tener el tipo de input correcto para la contraseña', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/contraseña/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('debe tener autocomplete configurado', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)

      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })
  })

  describe('Casos especiales', () => {
    it('debe prevenir el comportamiento por defecto del formulario', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ success: true })

      render(<LoginPage />)

      // Llenar campos primero
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form')!
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault')

      fireEvent(form, submitEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('debe manejar múltiples intentos de login', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({
        success: false,
        error: 'Credenciales inválidas',
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      // Primer intento
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrong1')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })

      // Limpiar campos
      await user.clear(emailInput)
      await user.clear(passwordInput)

      // Segundo intento exitoso
      mockSignIn.mockResolvedValue({ success: true })
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'correct')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    }, 10000)
  })
})
