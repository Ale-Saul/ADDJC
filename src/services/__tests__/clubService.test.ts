import { clubService } from '../clubService'
import { createClient } from '@/lib/supabase/client'
import { Club, ClubCreate } from '@/models/club'

// Mock de Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

const mockSupabase = {
  from: jest.fn(),
}

const mockCreateClient = require('@/lib/supabase/client').createClient as jest.Mock
mockCreateClient.mockReturnValue(mockSupabase)

describe('clubService', () => {
  const mockClub: Club = {
    id: '1',
    nombre_club: 'Club de Prueba',
    municipio: 'Bogotá',
    direccion: 'Calle 123',
    telefono_contacto: '1234567890',
    director_tecnico_id: null,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('debe retornar todos los clubes activos por defecto', async () => {
      const mockQueryResult = {
        data: [mockClub],
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

      const result = await clubService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockClub])
      expect(mockSupabase.from).toHaveBeenCalledWith('clubes')
    })

    it('debe retornar todos los clubes incluyendo inactivos cuando includeInactive es true', async () => {
      const mockQueryResult = {
        data: [mockClub],
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

      const result = await clubService.getAll(true)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockClub])
    })

    it('debe manejar errores correctamente', async () => {
      const mockError = new Error('Error de conexión')
      const mockQueryResult = {
        data: null,
        error: mockError,
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

      const result = await clubService.getAll()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de conexión')
    })
  })

  describe('getById', () => {
    it('debe retornar un club por ID', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockClub,
          error: null,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await clubService.getById('1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockClub)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('debe manejar errores cuando el club no existe', async () => {
      const mockError = { message: 'Club no encontrado' }
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

      const result = await clubService.getById('999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Club no encontrado')
    })
  })

  describe('create', () => {
    it('debe crear un nuevo club', async () => {
      const newClub: ClubCreate = {
        nombre_club: 'Nuevo Club',
        municipio: 'Medellín',
        activo: true,
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockClub, ...newClub },
          error: null,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await clubService.create(newClub)

      expect(result.success).toBe(true)
      expect(result.data?.nombre_club).toBe('Nuevo Club')
      expect(mockSupabase.from).toHaveBeenCalledWith('clubes')
    })

    it('debe manejar errores al crear un club', async () => {
      const newClub: ClubCreate = {
        nombre_club: 'Nuevo Club',
      }

      const mockError = new Error('Error de validación')
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockQuery),
      })

      const result = await clubService.create(newClub)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de validación')
    })
  })
})

