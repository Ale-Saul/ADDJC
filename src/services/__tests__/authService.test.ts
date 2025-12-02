import { authService } from '../authService'
import { createClient } from '@/lib/supabase/client'
import { LoginCredentials, SignUpData } from '@/models/auth'

// Mock de Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('authService', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    // Suprimir console.warn y console.error en los tests
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()

    // Mock básico de Supabase
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        getUser: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(),
          getPublicUrl: jest.fn(),
        })),
      },
    }

    mockCreateClient.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('signIn', () => {
    it('debe iniciar sesión exitosamente con credenciales válidas', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombres: 'Test',
        apellidos: 'User',
        rol: 'judoka' as const,
        club_id: null,
        avatar_url: null,
        activo: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      const mockSession = {
        access_token: 'token-123',
        expires_at: 1234567890,
      }

      // Mock signInWithPassword
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: mockUser.id },
          session: mockSession,
        },
        error: null,
      })

      // Mock getUserProfile
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.signIn(credentials)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        user: mockUser,
        access_token: mockSession.access_token,
        expires_at: mockSession.expires_at,
      })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password,
      })
    })

    it('debe retornar error si las credenciales son inválidas', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Credenciales inválidas' },
      })

      const result = await authService.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Credenciales inválidas')
    })

    it('debe retornar error si no se puede crear la sesión', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const result = await authService.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No se pudo crear la sesión')
    })

    it('debe retornar error si falla al obtener el perfil', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'token-123', expires_at: 1234567890 },
        },
        error: null,
      })

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Perfil no encontrado' },
        }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.signIn(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al obtener el perfil del usuario')
    })
  })

  describe('signOut', () => {
    it('debe cerrar sesión exitosamente', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const result = await authService.signOut()

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('debe retornar error si falla al cerrar sesión', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Error al cerrar sesión' },
      })

      const result = await authService.signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al cerrar sesión')
    })
  })

  describe('signUp', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const signUpData: SignUpData = {
        email: 'newuser@example.com',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
        rol: 'judoka',
        club_id: 'club-123',
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-123' },
        },
        error: null,
      })

      const result = await authService.signUp(signUpData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: 'new-user-123' })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            nombres: signUpData.nombres,
            apellidos: signUpData.apellidos,
            user_type: signUpData.rol,
            rol: signUpData.rol,
            club_id: signUpData.club_id,
          },
        },
      })
    })

    it('debe retornar error si el email ya existe', async () => {
      const signUpData: SignUpData = {
        email: 'existing@example.com',
        password: 'Password123',
        nombres: 'Test',
        apellidos: 'User',
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'El email ya está registrado' },
      })

      const result = await authService.signUp(signUpData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El email ya está registrado')
    })

    it('debe usar rol por defecto "judoka" si no se especifica', async () => {
      const signUpData: SignUpData = {
        email: 'newuser@example.com',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-123' },
        },
        error: null,
      })

      await authService.signUp(signUpData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            nombres: signUpData.nombres,
            apellidos: signUpData.apellidos,
            user_type: 'judoka',
            rol: 'judoka',
            club_id: undefined,
          },
        },
      })
    })
  })

  describe('getCurrentUser', () => {
    it('debe obtener el usuario actual autenticado', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombres: 'Test',
        apellidos: 'User',
        rol: 'judoka' as const,
        club_id: null,
        avatar_url: null,
        activo: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      })

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.getCurrentUser()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
    })

    it('debe retornar null si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No hay usuario autenticado' },
      })

      const result = await authService.getCurrentUser()

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  describe('getUserProfile', () => {
    it('debe obtener el perfil del usuario', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        nombres: 'Test',
        apellidos: 'User',
        rol: 'judoka',
        club_id: 'club-123',
        avatar_url: 'https://example.com/avatar.jpg',
        activo: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.getUserProfile('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProfile)
    })

    it('debe retornar error si el perfil no existe', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Perfil no encontrado' },
        }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.getUserProfile('user-invalid')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Perfil no encontrado')
    })
  })

  describe('resetPassword', () => {
    it('debe enviar email de recuperación exitosamente', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })

      const result = await authService.resetPassword('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalled()
    })

    it('debe usar redirectUrl personalizada si se proporciona', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })

      await authService.resetPassword('test@example.com', 'https://custom.com/reset')

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'https://custom.com/reset' }
      )
    })

    it('debe retornar error si falla al enviar el email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email no encontrado' },
      })

      const result = await authService.resetPassword('notfound@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email no encontrado')
    })
  })

  describe('updatePassword', () => {
    it('debe actualizar la contraseña exitosamente', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const result = await authService.updatePassword('NewPassword123')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewPassword123',
      })
    })

    it('debe retornar error si falla la actualización', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Error al actualizar contraseña' },
      })

      const result = await authService.updatePassword('NewPassword123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al actualizar contraseña')
    })
  })

  describe('updateProfile', () => {
    it('debe actualizar el perfil del usuario', async () => {
      const updatedProfile = {
        id: 'user-123',
        email: 'test@example.com',
        nombres: 'Nuevo',
        apellidos: 'Nombre',
        rol: 'judoka' as const,
        activo: true,
        created_at: '2024-01-01',
        updated_at: new Date().toISOString(),
      }

      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedProfile,
          error: null,
        }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.updateProfile('user-123', {
        nombres: 'Nuevo',
        apellidos: 'Nombre',
      })

      expect(result.success).toBe(true)
      expect(result.data?.nombres).toBe('Nuevo')
      expect(result.data?.apellidos).toBe('Nombre')
    })

    it('debe retornar error si falla la actualización', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error al actualizar perfil' },
        }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.updateProfile('user-123', {
        nombres: 'Nuevo',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al actualizar perfil')
    })
  })

  describe('uploadAvatar', () => {
    it('debe subir avatar exitosamente', async () => {
      const mockFile = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
      const publicUrl = 'https://example.com/avatars/user-123.jpg'

      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
      })
      mockSupabase.storage.from = mockStorageFrom

      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      })
      mockSupabase.from = mockFrom

      const result = await authService.uploadAvatar('user-123', mockFile)

      expect(result.success).toBe(true)
      expect(result.data).toBe(publicUrl)
    })

    it('debe retornar error si el archivo es muy grande', async () => {
      // Crear un archivo de más de 2MB
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      const result = await authService.uploadAvatar('user-123', largeFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('La imagen no debe superar los 2MB')
    })

    it('debe retornar error si el archivo no es una imagen', async () => {
      const textFile = new File(['content'], 'file.txt', { type: 'text/plain' })

      const result = await authService.uploadAvatar('user-123', textFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El archivo debe ser una imagen')
    })

    it('debe retornar error si falla la subida', async () => {
      const mockFile = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })

      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          error: { message: 'Error al subir archivo' },
        }),
        getPublicUrl: jest.fn(),
      })
      mockSupabase.storage.from = mockStorageFrom

      const result = await authService.uploadAvatar('user-123', mockFile)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Error al subir la imagen')
    })
  })
})
