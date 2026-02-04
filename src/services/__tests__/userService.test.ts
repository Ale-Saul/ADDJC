import { userService } from '../userService'

describe('userService', () => {
  // Guardar el fetch original
  const originalFetch = global.fetch

  beforeAll(() => {
    // Mock global de fetch solo para estos tests
    global.fetch = jest.fn()
  })

  afterAll(() => {
    // Restaurar fetch original después de todos los tests
    global.fetch = originalFetch
  })

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
      const email = 'juan.perez@test.com'
      const password = 'password123'

      // Mock de fetch para Admin API
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { userId: mockUserId }
        })
      })

      const result = await userService.createArbitroUser(nombres, apellidos, email, password)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          nombres,
          apellidos,
          rol: 'arbitro',
          club_id: undefined,
        }),
      })
    })

    it('debe manejar error al crear usuario en auth', async () => {
      const nombres = 'Juan'
      const apellidos = 'Pérez'
      const email = 'juan@test.com'
      const password = 'password123'

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Error de autenticación'
        })
      })

      const result = await userService.createArbitroUser(nombres, apellidos, email, password)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de autenticación')
    })

    it('debe validar que se requiere email y password', async () => {
      const nombres = 'Juan'
      const apellidos = 'Pérez'

      const result1 = await userService.createArbitroUser(nombres, apellidos, '', 'password123')
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('Email y contraseña son requeridos')

      const result2 = await userService.createArbitroUser(nombres, apellidos, 'test@test.com', '')
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('Email y contraseña son requeridos')
    })

    it('debe validar formato de email', async () => {
      const nombres = 'Juan'
      const apellidos = 'Pérez'
      const password = 'password123'

      const result = await userService.createArbitroUser(nombres, apellidos, 'invalid-email', password)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('El formato del email no es válido')
    })

    it('debe manejar excepciones inesperadas', async () => {
      const nombres = 'Juan'
      const apellidos = 'Pérez'
      const email = 'juan@test.com'
      const password = 'password123'

      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('Error de red')
      )

      const result = await userService.createArbitroUser(nombres, apellidos, email, password)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de red')
      expect(console.error).toHaveBeenCalledWith(
        'Error al crear usuario con Admin API:',
        expect.any(Error)
      )
    })
  })

  describe('createSenseiUser', () => {
    it('debe crear un usuario sensei exitosamente', async () => {
      const mockUserId = 'user-sensei-456'
      const nombres = 'María'
      const apellidos = 'González'
      const email = 'maria@test.com'
      const password = 'password123'

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { userId: mockUserId }
        })
      })

      const result = await userService.createSenseiUser(nombres, apellidos, email, password)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          nombres,
          apellidos,
          rol: 'sensei',
          club_id: undefined,
        }),
      })
    })

    it('debe manejar error al crear usuario sensei en auth', async () => {
      const nombres = 'María'
      const apellidos = 'González'
      const email = 'maria@test.com'
      const password = 'password123'

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Email ya existe'
        })
      })

      const result = await userService.createSenseiUser(nombres, apellidos, email, password)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email ya existe')
    })

    it('debe manejar excepciones al crear sensei', async () => {
      const nombres = 'María'
      const apellidos = 'González'
      const email = 'maria@test.com'
      const password = 'password123'

      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('Timeout de red')
      )

      const result = await userService.createSenseiUser(nombres, apellidos, email, password)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Timeout de red')
    })
  })

  describe('createJudokaUser', () => {
    it('debe crear un usuario judoka exitosamente', async () => {
      const mockUserId = 'user-judoka-789'
      const nombres = 'Pedro'
      const apellidos = 'Ramírez'
      const email = 'pedro@test.com'
      const password = 'password123'

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { userId: mockUserId }
        })
      })

      const result = await userService.createJudokaUser(nombres, apellidos, email, password)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ userId: mockUserId })
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          nombres,
          apellidos,
          rol: 'judoka',
          club_id: undefined,
        }),
      })
    })

    it('debe manejar error al crear usuario judoka en auth', async () => {
      const nombres = 'Pedro'
      const apellidos = 'Ramírez'
      const email = 'pedro@test.com'
      const password = 'password123'

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Servicio no disponible'
        })
      })

      const result = await userService.createJudokaUser(nombres, apellidos, email, password)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Servicio no disponible')
    })

    it('debe manejar excepciones al crear judoka', async () => {
      const nombres = 'Pedro'
      const apellidos = 'Ramírez'
      const email = 'pedro@test.com'
      const password = 'password123'

      // Mock fetch que lanza excepción
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('Error crítico del servidor')
      )

      const result = await userService.createJudokaUser(nombres, apellidos, email, password)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error crítico del servidor')
    })
  })
})
