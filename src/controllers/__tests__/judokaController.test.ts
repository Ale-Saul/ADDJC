import { judokaController } from '../judokaController'
import { judokaService } from '@/services/judokaService'

jest.mock('@/services/judokaService')

describe('judokaController', () => {
  const mockJudoka = {
    id: '1',
    usuario_id: 'user-123',
    nombres: 'Juan',
    apellidos: 'Perez',
    fecha_nacimiento: '1990-01-01',
    activo: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllJudokas', () => {
    it('should return all judokas', async () => {
      (judokaService.getAll as jest.Mock).mockResolvedValue({ success: true, data: [mockJudoka] })
      
      const result = await judokaController.getAllJudokas()
      
      expect(judokaService.getAll).toHaveBeenCalledWith(false)
      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockJudoka])
    })

    it('should return all judokas including inactive', async () => {
      (judokaService.getAll as jest.Mock).mockResolvedValue({ success: true, data: [mockJudoka] })
      
      const result = await judokaController.getAllJudokas(true)
      
      expect(judokaService.getAll).toHaveBeenCalledWith(true)
      expect(result.success).toBe(true)
    })
  })

  describe('getJudokasByClub', () => {
    it('should return judokas by club', async () => {
      (judokaService.getByClub as jest.Mock).mockResolvedValue({ success: true, data: [mockJudoka] })
      
      const result = await judokaController.getJudokasByClub('club-1')
      
      expect(judokaService.getByClub).toHaveBeenCalledWith('club-1')
      expect(result.success).toBe(true)
    })

    it('should return error if clubId is missing', async () => {
      const result = await judokaController.getJudokasByClub('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del club es requerido')
    })
  })

  describe('getJudokasByEntrenador', () => {
    it('should return judokas by entrenador', async () => {
      (judokaService.getByEntrenador as jest.Mock).mockResolvedValue({ success: true, data: [mockJudoka] })
      
      const result = await judokaController.getJudokasByEntrenador('entrenador-1')
      
      expect(judokaService.getByEntrenador).toHaveBeenCalledWith('entrenador-1')
      expect(result.success).toBe(true)
    })

    it('should return error if entrenadorId is missing', async () => {
      const result = await judokaController.getJudokasByEntrenador('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del entrenador es requerido')
    })
  })

  describe('getJudokaById', () => {
    it('should return a judoka by id', async () => {
      (judokaService.getById as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
      
      const result = await judokaController.getJudokaById('1')
      
      expect(judokaService.getById).toHaveBeenCalledWith('1')
      expect(result.success).toBe(true)
    })

    it('should return error if id is missing', async () => {
      const result = await judokaController.getJudokaById('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del judoka es requerido')
    })
  })

  describe('createJudoka', () => {
    const validJudoka = {
      usuario_id: 'user-123',
      nombres: 'Nuevo',
      apellidos: 'Judoka',
      fecha_nacimiento: '2000-01-01'
    }

    it('should create a judoka', async () => {
      (judokaService.create as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
      
      const result = await judokaController.createJudoka(validJudoka)
      
      expect(judokaService.create).toHaveBeenCalledWith(expect.objectContaining(validJudoka))
      expect(result.success).toBe(true)
    })

    it('should validate required fields', async () => {
      const invalidJudoka = { ...validJudoka, nombres: '' }
      
      const result = await judokaController.createJudoka(invalidJudoka)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('nombre es requerido')
      expect(judokaService.create).not.toHaveBeenCalled()
    })

    it('should validate name length', async () => {
      const invalidJudoka = { ...validJudoka, nombres: 'A' }
      
      const result = await judokaController.createJudoka(invalidJudoka)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('al menos 2 caracteres')
    })

    it('should validate weight', async () => {
      const invalidJudoka = { ...validJudoka, peso_competitivo: -5 }
      
      const result = await judokaController.createJudoka(invalidJudoka)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('peso no puede ser negativo')
    })
  })

  describe('updateJudoka', () => {
    it('should update a judoka', async () => {
      ;(judokaService.getById as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
      ;(judokaService.update as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
      
      const result = await judokaController.updateJudoka('1', { nombres: 'Updated' })
      
      expect(judokaService.update).toHaveBeenCalledWith('1', { nombres: 'Updated' })
      expect(result.success).toBe(true)
    })

    it('should return error if id is missing', async () => {
      const result = await judokaController.updateJudoka('', {})
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del judoka es requerido')
    })

    it('should return error if judoka not found', async () => {
      (judokaService.getById as jest.Mock).mockResolvedValue({ success: false })
      
      const result = await judokaController.updateJudoka('1', {})
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Judoka no encontrado')
    })
  })

  describe('deleteJudoka', () => {
    it('should delete a judoka', async () => {
      ;(judokaService.getById as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
      ;(judokaService.delete as jest.Mock).mockResolvedValue({ success: true })
      
      const result = await judokaController.deleteJudoka('1')
      
      expect(judokaService.delete).toHaveBeenCalledWith('1')
      expect(result.success).toBe(true)
    })

    it('should return error if judoka not found', async () => {
      (judokaService.getById as jest.Mock).mockResolvedValue({ success: false })
      
      const result = await judokaController.deleteJudoka('1')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Judoka no encontrado')
    })
  })

  describe('restoreJudoka', () => {
    it('should restore a judoka', async () => {
      (judokaService.restore as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
      
      const result = await judokaController.restoreJudoka('1')
      
      expect(judokaService.restore).toHaveBeenCalledWith('1')
      expect(result.success).toBe(true)
    })
  })
})
