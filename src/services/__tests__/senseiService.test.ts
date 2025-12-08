import { senseiService } from '../senseiService'
import { createClient } from '@/lib/supabase/client'
import { userService } from '../userService'
import { Sensei, SenseiCreate } from '@/models/sensei'

// Mocks
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))
jest.mock('../userService')

const mockSupabase = {
  from: jest.fn(),
}

const mockCreateClient = require('@/lib/supabase/client').createClient as jest.Mock
mockCreateClient.mockReturnValue(mockSupabase)

describe('senseiService', () => {
  const mockSensei: Sensei = {
    id: '1',
    usuario_id: 'user-123',
    club_id: 'club-456',
    nombres: 'Carlos',
    apellidos: 'García',
    fecha_nacimiento: '1980-05-15',
    grado_dan: '5to Dan',
    certificacion: 'Certificado Internacional',
    especialidad: 'Kata',
    foto_perfil: null,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('debe retornar todos los senseis activos por defecto', async () => {
      const mockQueryResult = {
        data: [mockSensei],
        error: null,
      }
      
      // Mock the complete chain: from().select().order().eq()
      const mockChain = {
        eq: jest.fn().mockResolvedValue(mockQueryResult)
      }
      
      const mockOrder = jest.fn().mockReturnValue(mockChain)
      const mockSelect = jest.fn().mockReturnValue({
        order: mockOrder
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const result = await senseiService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockSensei])
      expect(mockSupabase.from).toHaveBeenCalledWith('senseis')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockChain.eq).toHaveBeenCalledWith('activo', true)
    })

    it('debe retornar todos los senseis incluyendo inactivos cuando includeInactive es true', async () => {
      const mockQueryResult = {
        data: [mockSensei],
        error: null,
      }
      
      // When includeInactive is true, no eq() is called - only order()
      const mockOrder = jest.fn().mockResolvedValue(mockQueryResult)
      const mockSelect = jest.fn().mockReturnValue({
        order: mockOrder
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const result = await senseiService.getAll(true)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockSensei])
      expect(mockSupabase.from).toHaveBeenCalledWith('senseis')
    })

    it('debe manejar errores correctamente', async () => {
      const mockError = new Error('Error de conexión')
      const mockQueryResult = {
        data: null,
        error: mockError,
      }
      
      const mockChain = {
        eq: jest.fn().mockResolvedValue(mockQueryResult)
      }
      
      const mockOrder = jest.fn().mockReturnValue(mockChain)
      const mockSelect = jest.fn().mockReturnValue({
        order: mockOrder
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const result = await senseiService.getAll()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de conexión')
    })
  })

  describe('getByClub', () => {
    it('debe retornar senseis por club', async () => {
      const clubId = 'club-123'
      const mockQueryResult = {
        data: [mockSensei],
        error: null,
      }

      const mockOrder = jest.fn().mockResolvedValue(mockQueryResult)
      const mockEqActivo = jest.fn().mockReturnValue({
        order: mockOrder
      })
      const mockEqClub = jest.fn().mockReturnValue({
        eq: mockEqActivo
      })
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEqClub
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const result = await senseiService.getByClub(clubId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockSensei])
      expect(mockSupabase.from).toHaveBeenCalledWith('senseis')
      expect(mockEqClub).toHaveBeenCalledWith('club_id', clubId)
      expect(mockEqActivo).toHaveBeenCalledWith('activo', true)
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('debe manejar errores al buscar por club', async () => {
      const clubId = 'club-123'
      const mockError = new Error('Error de consulta')
      const mockQueryResult = {
        data: null,
        error: mockError,
      }

      const mockOrder = jest.fn().mockResolvedValue(mockQueryResult)
      const mockEqActivo = jest.fn().mockReturnValue({
        order: mockOrder
      })
      const mockEqClub = jest.fn().mockReturnValue({
        eq: mockEqActivo
      })
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEqClub
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const result = await senseiService.getByClub(clubId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de consulta')
    })
  })

  describe('getById', () => {
    it('debe retornar un sensei por ID', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSensei,
          error: null,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await senseiService.getById('1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSensei)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('debe manejar errores cuando el sensei no existe', async () => {
      const mockError = new Error('Sensei no encontrado')
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await senseiService.getById('999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Sensei no encontrado')
    })
  })

  describe('create', () => {
    it('debe crear un sensei con usuario_id válido (UUID)', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const newSensei: SenseiCreate = {
        usuario_id: validUUID,
        nombres: 'Carlos',
        apellidos: 'García',
        club_id: 'club-123',
        grado_dan: '5to Dan',
        activo: true,
      }

      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockSensei, usuario_id: validUUID },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      const result = await senseiService.create(newSensei)

      expect(result.success).toBe(true)
      expect(result.data?.usuario_id).toBe(validUUID)
      expect(userService.createSenseiUser).not.toHaveBeenCalled()
    })

    it('debe crear usuario automáticamente cuando usuario_id es temp-user-id', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const newSensei: SenseiCreate = {
        usuario_id: 'temp-user-id',
        nombres: 'Carlos',
        apellidos: 'García',
        club_id: 'club-123',
        grado_dan: '5to Dan',
        activo: true,
        email: 'carlos@test.com',
        password: 'password123',
      }

      ;(userService.createSenseiUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { userId: validUUID },
      })

      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockSensei, usuario_id: validUUID },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      const result = await senseiService.create(newSensei)

      expect(result.success).toBe(true)
      expect(userService.createSenseiUser).toHaveBeenCalledWith('Carlos', 'García', 'carlos@test.com', 'password123')
      expect(result.data?.usuario_id).toBe(validUUID)
    })

    it('debe manejar errores al crear usuario', async () => {
      const newSensei: SenseiCreate = {
        usuario_id: 'temp-user-id',
        nombres: 'Carlos',
        apellidos: 'García',
        email: 'carlos@test.com',
        password: 'password123',
      }

      ;(userService.createSenseiUser as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error al crear usuario',
      })

      const result = await senseiService.create(newSensei)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al crear usuario')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('debe manejar errores de usuario_id inválido', async () => {
      const newSensei: SenseiCreate = {
        usuario_id: 'usuario-invalido',
        nombres: 'Carlos',
        apellidos: 'García',
      }

      const result = await senseiService.create(newSensei)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: El usuario_id debe ser un UUID válido.')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('debe manejar errores de foreign key para usuario_id', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const newSensei: SenseiCreate = {
        usuario_id: validUUID,
        nombres: 'Carlos',
        apellidos: 'García',
      }

      const mockError = { message: 'violates foreign key constraint "senseis_usuario_id_fkey"' }
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      const result = await senseiService.create(newSensei)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: El usuario_id no existe en user_profiles. Por favor, primero crea el usuario y su perfil en el sistema.')
    })

    it('debe manejar errores de foreign key para club_id', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const newSensei: SenseiCreate = {
        usuario_id: validUUID,
        nombres: 'Carlos',
        apellidos: 'García',
        club_id: 'club-inexistente',
      }

      const mockError = { message: 'violates foreign key constraint "senseis_club_id_fkey"' }
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      })

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      const result = await senseiService.create(newSensei)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: El club_id no existe. Por favor, selecciona un club válido.')
    })
  })

  describe('update', () => {
    it('debe actualizar un sensei correctamente', async () => {
      const updateData = {
        nombres: 'Carlos Actualizado',
        grado_dan: '6to Dan',
      }

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockSensei, ...updateData },
          error: null,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await senseiService.update('1', updateData)

      expect(result.success).toBe(true)
      expect(result.data?.nombres).toBe('Carlos Actualizado')
      expect(result.data?.grado_dan).toBe('6to Dan')
    })

    it('debe manejar errores al actualizar', async () => {
      const updateData = { nombres: 'Carlos Actualizado' }
      const mockError = new Error('Error de actualización')

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await senseiService.update('1', updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de actualización')
    })
  })

  describe('delete', () => {
    it('debe marcar un sensei como inactivo', async () => {
      const mockSelectSingle = jest.fn().mockResolvedValue({
        data: { id: '1', usuario_id: 'user-123' },
        error: null,
      })
      
      const mockSelectEq = jest.fn().mockReturnValue({
        single: mockSelectSingle,
      })
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockSelectEq,
      })
      
      const mockUpdateEq = jest.fn().mockResolvedValue({
        error: null,
      })
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockUpdateEq,
      })
      
      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // Primera llamada: select para obtener el sensei
          return { select: mockSelect }
        } else {
          // Segunda llamada: update para marcar inactivo
          return { update: mockUpdate }
        }
      })

      const result = await senseiService.delete('1')

      expect(result.success).toBe(true)
    })

    it('debe manejar errores al eliminar', async () => {
      const mockError = new Error('Error al eliminar')
      const mockSelectSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })
      
      const mockSelectEq = jest.fn().mockReturnValue({
        single: mockSelectSingle,
      })
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockSelectEq,
      })
      
      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const result = await senseiService.delete('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al eliminar')
    })
  })

  describe('restore', () => {
    it('debe restaurar un sensei correctamente', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockSensei, activo: true },
          error: null,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await senseiService.restore('1')

      expect(result.success).toBe(true)
      expect(result.data?.activo).toBe(true)
    })

    it('debe manejar errores al restaurar', async () => {
      const mockError = new Error('Error al restaurar')
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await senseiService.restore('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al restaurar')
    })
  })
})
