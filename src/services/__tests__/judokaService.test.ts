import { judokaService } from '../judokaService'
import { createClient } from '@/lib/supabase/client'
import { userService } from '../userService'

// Mock supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

// Mock userService
jest.mock('../userService', () => ({
  userService: {
    createJudokaUser: jest.fn()
  }
}))

describe('judokaService', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabase: any

  const mockJudoka = {
    id: '1',
    usuario_id: '12345678-1234-1234-1234-123456789012',
    nombres: 'Juan',
    apellidos: 'Perez',
    fecha_nacimiento: '1990-01-01',
    activo: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock básico de Supabase
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockJudoka, error: null }),
        then: jest.fn((callback) => callback({ data: [mockJudoka], error: null }))
      }))
    }

    mockCreateClient.mockReturnValue(mockSupabase)
  })

  describe('getAll', () => {
    it('should return all active judokas by default', async () => {
      const result = await judokaService.getAll()
      
      expect(mockSupabase.from).toHaveBeenCalledWith('judokas')
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.select).toHaveBeenCalledWith('*')
      expect(query.eq).toHaveBeenCalledWith('activo', true)
      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockJudoka])
    })

    it('should return all judokas including inactive when specified', async () => {
      const result = await judokaService.getAll(true)
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.eq).not.toHaveBeenCalledWith('activo', true)
      expect(result.success).toBe(true)
    })

    it('should handle errors', async () => {
      const errorQuery = {
        then: (resolve: any) => Promise.resolve({ data: null, error: new Error('Error fetching') }).then(resolve),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
      }
      ;(mockSupabase.from as jest.Mock).mockReturnValue(errorQuery)
      
      const result = await judokaService.getAll()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error fetching')
    })
  })

  describe('getById', () => {
    it('should return a judoka by id', async () => {
      const result = await judokaService.getById('1')
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.select).toHaveBeenCalledWith('*')
      expect(query.eq).toHaveBeenCalledWith('id', '1')
      expect(query.single).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockJudoka)
    })

    it('should handle errors', async () => {
      const errorQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue({
          then: (resolve: any) => Promise.resolve({ data: null, error: new Error('Not found') }).then(resolve)
        })
      }
      ;(mockSupabase.from as jest.Mock).mockReturnValue(errorQuery)
      
      const result = await judokaService.getById('999')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Not found')
    })
  })

  describe('create', () => {
    const validUUID = '12345678-1234-1234-1234-123456789012'
    const newJudoka = {
      usuario_id: validUUID,
      nombres: 'Nuevo',
      apellidos: 'Judoka',
      fecha_nacimiento: '2000-01-01'
    }

    it('should create a judoka with existing user_id', async () => {
      const result = await judokaService.create(newJudoka)
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
        nombres: 'Nuevo',
        usuario_id: validUUID
      }))
      expect(result.success).toBe(true)
    })

    it('should create a user if usuario_id is temp-user-id', async () => {
      const judokaTemp = { ...newJudoka, usuario_id: 'temp-user-id' }
      
      ;(userService.createJudokaUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { userId: validUUID }
      })
      
      const result = await judokaService.create(judokaTemp)

      expect(userService.createJudokaUser).toHaveBeenCalledWith('Nuevo', 'Judoka')
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
        usuario_id: validUUID
      }))
      expect(result.success).toBe(true)
    })

    it('should return error if UUID is invalid', async () => {
      const judokaInvalidId = { ...newJudoka, usuario_id: 'invalid-id' }
      
      const result = await judokaService.create(judokaInvalidId)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('UUID válido')
    })
  })

  describe('update', () => {
    it('should update a judoka', async () => {
      const updateData = { nombres: 'Updated Name' }
      
      const result = await judokaService.update('1', updateData)
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.update).toHaveBeenCalledWith(updateData)
      expect(query.eq).toHaveBeenCalledWith('id', '1')
      expect(result.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('should soft delete a judoka', async () => {
      const result = await judokaService.delete('1')
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.update).toHaveBeenCalledWith({ activo: false })
      expect(query.eq).toHaveBeenCalledWith('id', '1')
      expect(result.success).toBe(true)
    })
  })
  
  describe('restore', () => {
    it('should restore a judoka', async () => {
      const result = await judokaService.restore('1')
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.update).toHaveBeenCalledWith({ activo: true })
      expect(query.eq).toHaveBeenCalledWith('id', '1')
      expect(result.success).toBe(true)
    })
  })
  
  describe('getByClub', () => {
    it('should return judokas by club', async () => {
      const result = await judokaService.getByClub('club-1')
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.eq).toHaveBeenCalledWith('club_id', 'club-1')
      expect(query.eq).toHaveBeenCalledWith('activo', true)
      expect(result.success).toBe(true)
    })
  })

  describe('getByEntrenador', () => {
    it('should return judokas by entrenador', async () => {
      const result = await judokaService.getByEntrenador('entrenador-1')
      
      const query = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(query.eq).toHaveBeenCalledWith('entrenador_id', 'entrenador-1')
      expect(query.eq).toHaveBeenCalledWith('activo', true)
      expect(result.success).toBe(true)
    })
  })
})

