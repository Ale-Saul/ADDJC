import { userService } from '../userService'
import { supabase } from '@/lib/supabase'

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn()
    },
    from: jest.fn(() => ({
      insert: jest.fn()
    }))
  }
}))

describe('userService', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Suprimir console.warn y console.error en los tests
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('createArbitroUser', () => {
    it('debe crear un usuario árbitro exitosamente', async () => {
      const mockUserId = 'user-arbitro-123'
      const nombres = 'Juan'
      const apellidos = 'Pérez'

      // Mock de signUp
      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            email: 'arbitro_test@temp.com'
          }
        },
        error: null
      })

      // Mock de insert
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const result = await userService.createArbitroUser(nombres, apellidos)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringContaining('arbitro_'),
          password: expect.any(String),
          options: {
            data: {
              nombres,
              apellidos,
              user_type: 'arbitro'
            }
          }
        })
      )
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockUserId,
        user_type: 'arbitro',
        nombres,
        apellidos,
        activo: true
      })
    })

    it('debe manejar error al crear usuario en auth', async () => {
      const nombres = 'Juan'
      const apellidos = 'Pérez'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Error de autenticación' }
      })

      const result = await userService.createArbitroUser(nombres, apellidos)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al crear usuario: Error de autenticación')
    })

    it('debe manejar cuando no se crea el usuario', async () => {
      const nombres = 'Juan'
      const apellidos = 'Pérez'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await userService.createArbitroUser(nombres, apellidos)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: No se pudo crear el usuario')
    })

    it('debe continuar si falla la creación del perfil', async () => {
      const mockUserId = 'user-arbitro-123'
      const nombres = 'Juan'
      const apellidos = 'Pérez'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            email: 'arbitro_test@temp.com'
          }
        },
        error: null
      })

      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Error al insertar perfil' }
      })
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const result = await userService.createArbitroUser(nombres, apellidos)

      // El servicio continúa a pesar del error en el perfil
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(console.warn).toHaveBeenCalledWith(
        'Error al crear perfil de usuario:',
        'Error al insertar perfil'
      )
    })

    it('debe manejar excepciones inesperadas', async () => {
      const nombres = 'Juan'
      const apellidos = 'Pérez'

      mockSupabase.auth.signUp = jest.fn().mockRejectedValue(
        new Error('Error de red')
      )

      const result = await userService.createArbitroUser(nombres, apellidos)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de red')
      expect(console.error).toHaveBeenCalledWith(
        'Error al crear usuario de árbitro:',
        expect.any(Error)
      )
    })
  })

  describe('createSenseiUser', () => {
    it('debe crear un usuario sensei exitosamente', async () => {
      const mockUserId = 'user-sensei-456'
      const nombres = 'María'
      const apellidos = 'González'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            email: 'sensei_test@temp.com'
          }
        },
        error: null
      })

      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const result = await userService.createSenseiUser(nombres, apellidos)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringContaining('sensei_'),
          password: expect.any(String),
          options: {
            data: {
              nombres,
              apellidos,
              user_type: 'sensei'
            }
          }
        })
      )
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockUserId,
        user_type: 'sensei',
        nombres,
        apellidos,
        activo: true
      })
    })

    it('debe manejar error al crear usuario sensei en auth', async () => {
      const nombres = 'María'
      const apellidos = 'González'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Email ya existe' }
      })

      const result = await userService.createSenseiUser(nombres, apellidos)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al crear usuario: Email ya existe')
    })

    it('debe manejar excepciones al crear sensei', async () => {
      const nombres = 'María'
      const apellidos = 'González'

      mockSupabase.auth.signUp = jest.fn().mockRejectedValue(
        new Error('Timeout de red')
      )

      const result = await userService.createSenseiUser(nombres, apellidos)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Timeout de red')
    })
  })

  describe('createJudokaUser', () => {
    it('debe crear un usuario judoka exitosamente', async () => {
      const mockUserId = 'user-judoka-789'
      const nombres = 'Pedro'
      const apellidos = 'Ramírez'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            email: 'judoka_test@temp.com'
          }
        },
        error: null
      })

      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const result = await userService.createJudokaUser(nombres, apellidos)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringContaining('judoka_'),
          password: expect.any(String),
          options: {
            data: {
              nombres,
              apellidos,
              user_type: 'judoka'
            }
          }
        })
      )
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockUserId,
        user_type: 'judoka',
        nombres,
        apellidos,
        activo: true
      })
    })

    it('debe manejar error al crear usuario judoka en auth', async () => {
      const nombres = 'Pedro'
      const apellidos = 'Ramírez'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Servicio no disponible' }
      })

      const result = await userService.createJudokaUser(nombres, apellidos)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al crear usuario: Servicio no disponible')
    })

    it('debe continuar si falla la creación del perfil de judoka', async () => {
      const mockUserId = 'user-judoka-789'
      const nombres = 'Pedro'
      const apellidos = 'Ramírez'

      mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            email: 'judoka_test@temp.com'
          }
        },
        error: null
      })

      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Conflicto con perfil existente' }
      })
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: mockInsert
      })

      const result = await userService.createJudokaUser(nombres, apellidos)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(console.warn).toHaveBeenCalledWith(
        'Error al crear perfil de usuario:',
        'Conflicto con perfil existente'
      )
    })

    it('debe manejar excepciones al crear judoka', async () => {
      const nombres = 'Pedro'
      const apellidos = 'Ramírez'

      mockSupabase.auth.signUp = jest.fn().mockRejectedValue(
        new Error('Error crítico del servidor')
      )

      const result = await userService.createJudokaUser(nombres, apellidos)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error crítico del servidor')
      expect(console.error).toHaveBeenCalledWith(
        'Error al crear usuario de judoka:',
        expect.any(Error)
      )
    })
  })
})
