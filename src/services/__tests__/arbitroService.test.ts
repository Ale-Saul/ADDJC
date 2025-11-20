import { arbitroService } from '../arbitroService'
import { supabase } from '@/lib/supabase'
import { userService } from '../userService'
import { Arbitro, ArbitroCreate } from '@/models/arbitro'

// Mocks
jest.mock('@/lib/supabase')
jest.mock('../userService')

describe('arbitroService', () => {
  const mockArbitro: Arbitro = {
    id: '1',
    usuario_id: 'user-123',
    nombres: 'Juan',
    apellidos: 'Pérez',
    fecha_nacimiento: '1990-01-01',
    nivel_arbitraje: 'Nacional',
    certificacion: null,
    foto_perfil: null,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('debe crear un árbitro con usuario_id válido (UUID)', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const newArbitro: ArbitroCreate = {
        usuario_id: validUUID,
        nombres: 'Juan',
        apellidos: 'Pérez',
        nivel_arbitraje: 'Nacional',
        activo: true,
      }

      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockArbitro, usuario_id: validUUID },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      const result = await arbitroService.create(newArbitro)

      expect(result.success).toBe(true)
      expect(result.data?.usuario_id).toBe(validUUID)
      expect(userService.createArbitroUser).not.toHaveBeenCalled()
    })

    it('debe crear usuario automáticamente cuando usuario_id es temp-user-id', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const newArbitro: ArbitroCreate = {
        usuario_id: 'temp-user-id',
        nombres: 'Juan',
        apellidos: 'Pérez',
        nivel_arbitraje: 'Nacional',
        activo: true,
      }

      ;(userService.createArbitroUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { userId: validUUID },
      })

      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockArbitro, usuario_id: validUUID },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      const result = await arbitroService.create(newArbitro)

      expect(result.success).toBe(true)
      expect(userService.createArbitroUser).toHaveBeenCalledWith('Juan', 'Pérez')
      expect(result.data?.usuario_id).toBe(validUUID)
    })

    it('debe manejar errores al crear usuario', async () => {
      const newArbitro: ArbitroCreate = {
        usuario_id: 'temp-user-id',
        nombres: 'Juan',
        apellidos: 'Pérez',
      }

      ;(userService.createArbitroUser as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error al crear usuario',
      })

      const result = await arbitroService.create(newArbitro)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al crear usuario')
      expect(supabase.from).not.toHaveBeenCalled()
    })
  })

  describe('getAll', () => {
    it('debe retornar todos los árbitros activos por defecto', async () => {
      const mockQueryResult = {
        data: [mockArbitro],
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

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const result = await arbitroService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockArbitro])
      expect(supabase.from).toHaveBeenCalledWith('arbitros')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockChain.eq).toHaveBeenCalledWith('activo', true)
    })
  })
})

