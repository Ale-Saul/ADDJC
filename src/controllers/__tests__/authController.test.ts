import { authController } from '../authController'
import { authService } from '@/services/authService'
import { LoginCredentials, SignUpData } from '@/models/auth'

// Mock del servicio de autenticación
jest.mock('@/services/authService', () => ({
  authService: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    getCurrentUser: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    updateProfile: jest.fn(),
    uploadAvatar: jest.fn(),
  },
}))

describe('authController', () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signIn', () => {
    it('debe iniciar sesión con credenciales válidas', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            nombres: 'Test',
            apellidos: 'User',
            rol: 'judoka' as const,
            activo: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          access_token: 'token-123',
          expires_at: 1234567890,
        },
      }

      mockAuthService.signIn.mockResolvedValue(mockResponse)

      const result = await authController.signIn(credentials)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
      expect(mockAuthService.signIn).toHaveBeenCalledWith(credentials)
    })

    it('debe retornar error si falta el email', async () => {
      const credentials: LoginCredentials = {
        email: '',
        password: 'password123',
      }

      const result = await authController.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email y contraseña son requeridos')
      expect(mockAuthService.signIn).not.toHaveBeenCalled()
    })

    it('debe retornar error si falta la contraseña', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: '',
      }

      const result = await authController.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email y contraseña son requeridos')
      expect(mockAuthService.signIn).not.toHaveBeenCalled()
    })

    it('debe retornar error si el formato del email es inválido', async () => {
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'password123',
      }

      const result = await authController.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El formato del email no es válido')
      expect(mockAuthService.signIn).not.toHaveBeenCalled()
    })

    it('debe retornar error si la contraseña es muy corta', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: '12345',
      }

      const result = await authController.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('La contraseña debe tener al menos 6 caracteres')
      expect(mockAuthService.signIn).not.toHaveBeenCalled()
    })

    it('debe retornar error si el usuario está inactivo', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            nombres: 'Test',
            apellidos: 'User',
            rol: 'judoka' as const,
            activo: false,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          access_token: 'token-123',
          expires_at: 1234567890,
        },
      }

      mockAuthService.signIn.mockResolvedValue(mockResponse)

      const result = await authController.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tu cuenta está inactiva. Contacta al administrador.')
    })
  })

  describe('signOut', () => {
    it('debe cerrar sesión exitosamente', async () => {
      mockAuthService.signOut.mockResolvedValue({ success: true })

      const result = await authController.signOut()

      expect(result.success).toBe(true)
      expect(mockAuthService.signOut).toHaveBeenCalled()
    })

    it('debe retornar error si falla el cierre de sesión', async () => {
      mockAuthService.signOut.mockResolvedValue({
        success: false,
        error: 'Error al cerrar sesión',
      })

      const result = await authController.signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al cerrar sesión')
    })
  })

  describe('signUp', () => {
    it('debe registrar un usuario con datos válidos', async () => {
      const signUpData: SignUpData = {
        email: 'newuser@example.com',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
        rol: 'judoka',
      }

      mockAuthService.signUp.mockResolvedValue({
        success: true,
        data: { userId: 'new-user-123' },
      })

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: 'new-user-123' })
      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpData)
    })

    it('debe retornar error si falta el email', async () => {
      const signUpData: SignUpData = {
        email: '',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Todos los campos son requeridos')
      expect(mockAuthService.signUp).not.toHaveBeenCalled()
    })

    it('debe retornar error si falta la contraseña', async () => {
      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: '',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Todos los campos son requeridos')
    })

    it('debe retornar error si falta el nombre', async () => {
      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: 'Password123',
        nombres: '',
        apellidos: 'Usuario',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Todos los campos son requeridos')
    })

    it('debe retornar error si falta el apellido', async () => {
      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: '',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Todos los campos son requeridos')
    })

    it('debe retornar error si el formato del email es inválido', async () => {
      const signUpData: SignUpData = {
        email: 'invalid-email',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El formato del email no es válido')
    })

    it('debe retornar error si la contraseña es muy corta', async () => {
      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: 'Pass12',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('La contraseña debe tener al menos 8 caracteres')
    })

    it('debe retornar error si la contraseña no tiene mayúscula, minúscula y número', async () => {
      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: 'password',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      )
    })

    it('debe retornar error si el nombre es muy corto', async () => {
      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: 'Password123',
        nombres: 'A',
        apellidos: 'Usuario',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre debe tener al menos 2 caracteres')
    })

    it('debe retornar error si los apellidos son muy cortos', async () => {
      const signUpData: SignUpData = {
        email: 'test@example.com',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'U',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos deben tener al menos 2 caracteres')
    })

    it('debe retornar error si el rol no es válido', async () => {
      const signUpData: any = {
        email: 'test@example.com',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
        rol: 'invalid-role',
      }

      const result = await authController.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rol no válido')
    })
  })

  describe('getCurrentUser', () => {
    it('debe obtener el usuario actual', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombres: 'Test',
        apellidos: 'User',
        rol: 'judoka' as const,
        activo: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      mockAuthService.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      })

      const result = await authController.getCurrentUser()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
    })

    it('debe retornar null si no hay usuario autenticado', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        success: true,
        data: null,
      })

      const result = await authController.getCurrentUser()

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('debe enviar email de recuperación con email válido', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ success: true })

      const result = await authController.resetPassword('test@example.com')

      expect(result.success).toBe(true)
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        undefined
      )
    })

    it('debe enviar email con redirectUrl personalizada', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ success: true })

      const result = await authController.resetPassword(
        'test@example.com',
        'https://custom.com/reset'
      )

      expect(result.success).toBe(true)
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        'https://custom.com/reset'
      )
    })

    it('debe retornar error si falta el email', async () => {
      const result = await authController.resetPassword('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('El email es requerido')
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled()
    })

    it('debe retornar error si el formato del email es inválido', async () => {
      const result = await authController.resetPassword('invalid-email')

      expect(result.success).toBe(false)
      expect(result.error).toBe('El formato del email no es válido')
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled()
    })
  })

  describe('updatePassword', () => {
    it('debe actualizar la contraseña con contraseña válida', async () => {
      mockAuthService.updatePassword.mockResolvedValue({ success: true })

      const result = await authController.updatePassword('NewPassword123')

      expect(result.success).toBe(true)
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith('NewPassword123')
    })

    it('debe retornar error si falta la nueva contraseña', async () => {
      const result = await authController.updatePassword('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('La nueva contraseña es requerida')
      expect(mockAuthService.updatePassword).not.toHaveBeenCalled()
    })

    it('debe retornar error si la contraseña es muy corta', async () => {
      const result = await authController.updatePassword('Pass12')

      expect(result.success).toBe(false)
      expect(result.error).toBe('La contraseña debe tener al menos 8 caracteres')
    })

    it('debe retornar error si la contraseña no tiene mayúscula, minúscula y número', async () => {
      const result = await authController.updatePassword('password')

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      )
    })
  })

  describe('updateProfile', () => {
    it('debe actualizar el perfil con datos válidos', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombres: 'Nuevo',
        apellidos: 'Nombre',
        rol: 'judoka' as const,
        activo: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      }

      mockAuthService.updateProfile.mockResolvedValue({
        success: true,
        data: mockUpdatedUser,
      })

      const result = await authController.updateProfile('user-123', {
        nombres: 'Nuevo',
        apellidos: 'Nombre',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedUser)
    })

    it('debe retornar error si falta el userId', async () => {
      const result = await authController.updateProfile('', { nombres: 'Nuevo' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID de usuario requerido')
      expect(mockAuthService.updateProfile).not.toHaveBeenCalled()
    })

    it('debe retornar error si el nombre es muy corto', async () => {
      const result = await authController.updateProfile('user-123', { nombres: 'A' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre debe tener al menos 2 caracteres')
    })

    it('debe retornar error si los apellidos son muy cortos', async () => {
      const result = await authController.updateProfile('user-123', { apellidos: 'B' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos deben tener al menos 2 caracteres')
    })
  })

  describe('uploadAvatar', () => {
    it('debe subir avatar con datos válidos', async () => {
      const mockFile = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
      const publicUrl = 'https://example.com/avatars/user-123.jpg'

      mockAuthService.uploadAvatar.mockResolvedValue({
        success: true,
        data: publicUrl,
      })

      const result = await authController.uploadAvatar('user-123', mockFile)

      expect(result.success).toBe(true)
      expect(result.data).toBe(publicUrl)
      expect(mockAuthService.uploadAvatar).toHaveBeenCalledWith('user-123', mockFile)
    })

    it('debe retornar error si falta el userId', async () => {
      const mockFile = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })

      const result = await authController.uploadAvatar('', mockFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Datos incompletos para subir imagen')
      expect(mockAuthService.uploadAvatar).not.toHaveBeenCalled()
    })

    it('debe retornar error si falta el archivo', async () => {
      const result = await authController.uploadAvatar('user-123', null as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Datos incompletos para subir imagen')
      expect(mockAuthService.uploadAvatar).not.toHaveBeenCalled()
    })
  })
})
