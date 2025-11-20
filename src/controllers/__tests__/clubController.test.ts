import { clubController } from '../clubController'
import { clubService } from '@/services/clubService'
import { Club, ClubCreate } from '@/models/club'

// Mock del servicio
jest.mock('@/services/clubService')

describe('clubController', () => {
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

  describe('getAllClubes', () => {
    it('debe retornar todos los clubes', async () => {
      ;(clubService.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockClub],
      })

      const result = await clubController.getAllClubes()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockClub])
      expect(clubService.getAll).toHaveBeenCalledWith(false)
    })

    it('debe pasar includeInactive al servicio', async () => {
      ;(clubService.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockClub],
      })

      await clubController.getAllClubes(true)

      expect(clubService.getAll).toHaveBeenCalledWith(true)
    })
  })

  describe('getClubById', () => {
    it('debe retornar un club por ID', async () => {
      ;(clubService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockClub,
      })

      const result = await clubController.getClubById('1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockClub)
      expect(clubService.getById).toHaveBeenCalledWith('1')
    })

    it('debe validar que el ID sea requerido', async () => {
      const result = await clubController.getClubById('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del club es requerido')
      expect(clubService.getById).not.toHaveBeenCalled()
    })
  })

  describe('createClub', () => {
    it('debe crear un club válido', async () => {
      const newClub: ClubCreate = {
        nombre_club: 'Nuevo Club',
        municipio: 'Medellín',
        activo: true,
      }

      ;(clubService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockClub, ...newClub },
      })

      const result = await clubController.createClub(newClub)

      expect(result.success).toBe(true)
      expect(clubService.create).toHaveBeenCalledWith({
        ...newClub,
        activo: true,
      })
    })

    it('debe validar que el nombre del club sea requerido', async () => {
      const invalidClub: ClubCreate = {
        nombre_club: '',
        activo: true,
      }

      const result = await clubController.createClub(invalidClub)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre del club es requerido')
      expect(clubService.create).not.toHaveBeenCalled()
    })

    it('debe establecer activo como true por defecto', async () => {
      const newClub: ClubCreate = {
        nombre_club: 'Nuevo Club',
      }

      ;(clubService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockClub,
      })

      await clubController.createClub(newClub)

      expect(clubService.create).toHaveBeenCalledWith({
        ...newClub,
        activo: true,
      })
    })
  })

  describe('updateClub', () => {
    it('debe actualizar un club válido', async () => {
      const updateData = {
        nombre_club: 'Club Actualizado',
      }

      ;(clubService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockClub, ...updateData },
      })

      const result = await clubController.updateClub('1', updateData)

      expect(result.success).toBe(true)
      expect(clubService.update).toHaveBeenCalledWith('1', updateData)
    })

    it('debe validar que el ID sea requerido', async () => {
      const result = await clubController.updateClub('', { nombre_club: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del club es requerido')
    })

    it('debe validar que el nombre no esté vacío si se proporciona', async () => {
      const result = await clubController.updateClub('1', { nombre_club: '' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre del club no puede estar vacío')
    })
  })
})

