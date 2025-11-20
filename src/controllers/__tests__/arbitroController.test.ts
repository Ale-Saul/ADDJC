import { arbitroController } from '../arbitroController'
import { arbitroService } from '@/services/arbitroService'

jest.mock('@/services/arbitroService')

describe('arbitroController', () => {
  const mockArbitro = {
    id: '1',
    usuario_id: 'user-123',
    nombres: 'Arbitro',
    apellidos: 'Prueba',
    activo: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllArbitros', () => {
    it('should return all arbitros', async () => {
      (arbitroService.getAll as jest.Mock).mockResolvedValue({ success: true, data: [mockArbitro] })
      
      const result = await arbitroController.getAllArbitros()
      
      expect(arbitroService.getAll).toHaveBeenCalledWith(false)
      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockArbitro])
    })

    it('should return all arbitros including inactive', async () => {
      (arbitroService.getAll as jest.Mock).mockResolvedValue({ success: true, data: [mockArbitro] })
      
      const result = await arbitroController.getAllArbitros(true)
      
      expect(arbitroService.getAll).toHaveBeenCalledWith(true)
      expect(result.success).toBe(true)
    })
  })

  describe('getArbitroById', () => {
    it('should return an arbitro by id', async () => {
      (arbitroService.getById as jest.Mock).mockResolvedValue({ success: true, data: mockArbitro })
      
      const result = await arbitroController.getArbitroById('1')
      
      expect(arbitroService.getById).toHaveBeenCalledWith('1')
      expect(result.success).toBe(true)
    })

    it('should return error if id is missing', async () => {
      const result = await arbitroController.getArbitroById('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del árbitro es requerido')
    })
  })

  describe('createArbitro', () => {
    const validArbitro = {
      usuario_id: 'user-123',
      nombres: 'Nuevo',
      apellidos: 'Arbitro'
    }

    it('should create an arbitro', async () => {
      (arbitroService.create as jest.Mock).mockResolvedValue({ success: true, data: mockArbitro })
      
      const result = await arbitroController.createArbitro(validArbitro)
      
      expect(arbitroService.create).toHaveBeenCalledWith(expect.objectContaining(validArbitro))
      expect(result.success).toBe(true)
    })

    it('should validate required fields', async () => {
      const invalidArbitro = { ...validArbitro, nombres: '' }
      
      const result = await arbitroController.createArbitro(invalidArbitro)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('nombre es requerido')
      expect(arbitroService.create).not.toHaveBeenCalled()
    })

    it('should validate name length', async () => {
      const invalidArbitro = { ...validArbitro, nombres: 'A' }
      
      const result = await arbitroController.createArbitro(invalidArbitro)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('al menos 2 caracteres')
    })
  })

  describe('updateArbitro', () => {
    it('should update an arbitro', async () => {
      (arbitroService.getById as jest.Mock).mockResolvedValue({ success: true, data: mockArbitro })
      ;(arbitroService.update as jest.Mock).mockResolvedValue({ success: true, data: mockArbitro })
      
      const result = await arbitroController.updateArbitro('1', { nombres: 'Updated' })
      
      expect(arbitroService.update).toHaveBeenCalledWith('1', { nombres: 'Updated' })
      expect(result.success).toBe(true)
    })

    it('should return error if id is missing', async () => {
      const result = await arbitroController.updateArbitro('', {})
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del árbitro es requerido')
    })

    it('should return error if arbitro not found', async () => {
      (arbitroService.getById as jest.Mock).mockResolvedValue({ success: false })
      
      const result = await arbitroController.updateArbitro('1', {})
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Árbitro no encontrado')
    })
  })

  describe('deleteArbitro', () => {
    it('should delete an arbitro', async () => {
      (arbitroService.getById as jest.Mock).mockResolvedValue({ success: true, data: mockArbitro })
      ;(arbitroService.delete as jest.Mock).mockResolvedValue({ success: true })
      
      const result = await arbitroController.deleteArbitro('1')
      
      expect(arbitroService.delete).toHaveBeenCalledWith('1')
      expect(result.success).toBe(true)
    })

    it('should return error if arbitro not found', async () => {
      (arbitroService.getById as jest.Mock).mockResolvedValue({ success: false })
      
      const result = await arbitroController.deleteArbitro('1')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Árbitro no encontrado')
    })
  })

  describe('restoreArbitro', () => {
    it('should restore an arbitro', async () => {
      (arbitroService.restore as jest.Mock).mockResolvedValue({ success: true, data: mockArbitro })
      
      const result = await arbitroController.restoreArbitro('1')
      
      expect(arbitroService.restore).toHaveBeenCalledWith('1')
      expect(result.success).toBe(true)
    })
  })
})
