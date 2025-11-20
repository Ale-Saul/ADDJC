import { senseiController } from '../senseiController'
import { senseiService } from '@/services/senseiService'
import { Sensei, SenseiCreate } from '@/models/sensei'

// Mock del servicio
jest.mock('@/services/senseiService')

describe('senseiController', () => {
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

  describe('getAllSenseis', () => {
    it('debe retornar todos los senseis', async () => {
      ;(senseiService.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockSensei],
      })

      const result = await senseiController.getAllSenseis()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockSensei])
      expect(senseiService.getAll).toHaveBeenCalledWith(false)
    })

    it('debe pasar includeInactive al servicio', async () => {
      ;(senseiService.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockSensei],
      })

      await senseiController.getAllSenseis(true)

      expect(senseiService.getAll).toHaveBeenCalledWith(true)
    })
  })

  describe('getSenseisByClub', () => {
    it('debe retornar senseis por club', async () => {
      const clubId = 'club-123'
      ;(senseiService.getByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockSensei],
      })

      const result = await senseiController.getSenseisByClub(clubId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockSensei])
      expect(senseiService.getByClub).toHaveBeenCalledWith(clubId)
    })

    it('debe retornar error cuando no se proporciona clubId', async () => {
      const result = await senseiController.getSenseisByClub('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del club es requerido')
      expect(senseiService.getByClub).not.toHaveBeenCalled()
    })

    it('debe propagar errores del servicio', async () => {
      ;(senseiService.getByClub as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error del servicio',
      })

      const result = await senseiController.getSenseisByClub('club-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error del servicio')
    })
  })

  describe('getSenseiById', () => {
    it('debe retornar un sensei por ID', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const result = await senseiController.getSenseiById('1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSensei)
      expect(senseiService.getById).toHaveBeenCalledWith('1')
    })

    it('debe retornar error cuando no se proporciona ID', async () => {
      const result = await senseiController.getSenseiById('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del sensei es requerido')
      expect(senseiService.getById).not.toHaveBeenCalled()
    })

    it('debe propagar errores del servicio', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Sensei no encontrado',
      })

      const result = await senseiController.getSenseiById('999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Sensei no encontrado')
    })
  })

  describe('createSensei', () => {
    const validSenseiData: SenseiCreate = {
      usuario_id: 'temp-user-id',
      nombres: 'Carlos',
      apellidos: 'García',
      club_id: 'club-123',
    }

    it('debe crear un sensei válido', async () => {
      ;(senseiService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const result = await senseiController.createSensei(validSenseiData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSensei)
      expect(senseiService.create).toHaveBeenCalledWith({
        ...validSenseiData,
        activo: true
      })
    })

    it('debe preservar activo cuando se especifica explícitamente', async () => {
      ;(senseiService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const senseiDataInactivo = { ...validSenseiData, activo: false }
      await senseiController.createSensei(senseiDataInactivo)

      expect(senseiService.create).toHaveBeenCalledWith({
        ...validSenseiData,
        activo: false
      })
    })

    // Pruebas de validación de nombres
    it('debe retornar error si nombres está vacío', async () => {
      const invalidData = { ...validSenseiData, nombres: '' }

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre es requerido')
      expect(senseiService.create).not.toHaveBeenCalled()
    })

    it('debe retornar error si nombres está ausente', async () => {
      const invalidData = { ...validSenseiData }
      delete (invalidData as any).nombres

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre es requerido')
    })

    it('debe retornar error si nombres es muy corto', async () => {
      const invalidData = { ...validSenseiData, nombres: 'A' }

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre debe tener al menos 2 caracteres')
    })

    it('debe retornar error si nombres es muy largo', async () => {
      const invalidData = { ...validSenseiData, nombres: 'A'.repeat(101) }

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre no puede exceder 100 caracteres')
    })

    // Pruebas de validación de apellidos
    it('debe retornar error si apellidos está vacío', async () => {
      const invalidData = { ...validSenseiData, apellidos: '   ' }

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos son requeridos')
    })

    it('debe retornar error si apellidos está ausente', async () => {
      const invalidData = { ...validSenseiData }
      delete (invalidData as any).apellidos

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos son requeridos')
    })

    it('debe retornar error si apellidos es muy corto', async () => {
      const invalidData = { ...validSenseiData, apellidos: 'G' }

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos deben tener al menos 2 caracteres')
    })

    it('debe retornar error si apellidos es muy largo', async () => {
      const invalidData = { ...validSenseiData, apellidos: 'G'.repeat(101) }

      const result = await senseiController.createSensei(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos no pueden exceder 100 caracteres')
    })

    it('debe propagar errores del servicio', async () => {
      ;(senseiService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error del servicio',
      })

      const result = await senseiController.createSensei(validSenseiData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error del servicio')
    })
  })

  describe('updateSensei', () => {
    const validUpdateData = {
      nombres: 'Carlos Actualizado',
      grado_dan: '6to Dan',
    }

    it('debe actualizar un sensei válido', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })
      ;(senseiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockSensei, ...validUpdateData },
      })

      const result = await senseiController.updateSensei('1', validUpdateData)

      expect(result.success).toBe(true)
      expect(senseiService.getById).toHaveBeenCalledWith('1')
      expect(senseiService.update).toHaveBeenCalledWith('1', validUpdateData)
    })

    it('debe retornar error cuando no se proporciona ID', async () => {
      const result = await senseiController.updateSensei('', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del sensei es requerido')
      expect(senseiService.getById).not.toHaveBeenCalled()
    })

    it('debe retornar error cuando el sensei no existe', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Sensei no encontrado',
      })

      const result = await senseiController.updateSensei('999', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Sensei no encontrado')
      expect(senseiService.update).not.toHaveBeenCalled()
    })

    // Pruebas de validación para nombres en actualización
    it('debe retornar error si nombres está vacío en actualización', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const result = await senseiController.updateSensei('1', { nombres: '   ' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre no puede estar vacío')
    })

    it('debe retornar error si nombres es muy corto en actualización', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const result = await senseiController.updateSensei('1', { nombres: 'A' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre debe tener al menos 2 caracteres')
    })

    // Pruebas de validación para apellidos en actualización
    it('debe retornar error si apellidos está vacío en actualización', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const result = await senseiController.updateSensei('1', { apellidos: '' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos no pueden estar vacíos')
    })

    it('debe retornar error si apellidos es muy largo en actualización', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const result = await senseiController.updateSensei('1', { apellidos: 'G'.repeat(101) })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Los apellidos no pueden exceder 100 caracteres')
    })

    it('debe permitir actualización sin validar campos no enviados', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })
      ;(senseiService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })

      const result = await senseiController.updateSensei('1', { grado_dan: '6to Dan' })

      expect(result.success).toBe(true)
      expect(senseiService.update).toHaveBeenCalledWith('1', { grado_dan: '6to Dan' })
    })
  })

  describe('deleteSensei', () => {
    it('debe eliminar un sensei válido', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })
      ;(senseiService.delete as jest.Mock).mockResolvedValue({
        success: true,
      })

      const result = await senseiController.deleteSensei('1')

      expect(result.success).toBe(true)
      expect(senseiService.getById).toHaveBeenCalledWith('1')
      expect(senseiService.delete).toHaveBeenCalledWith('1')
    })

    it('debe retornar error cuando no se proporciona ID', async () => {
      const result = await senseiController.deleteSensei('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del sensei es requerido')
      expect(senseiService.getById).not.toHaveBeenCalled()
    })

    it('debe retornar error cuando el sensei no existe', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Sensei no encontrado',
      })

      const result = await senseiController.deleteSensei('999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Sensei no encontrado')
      expect(senseiService.delete).not.toHaveBeenCalled()
    })

    it('debe propagar errores del servicio de eliminación', async () => {
      ;(senseiService.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei,
      })
      ;(senseiService.delete as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error al eliminar',
      })

      const result = await senseiController.deleteSensei('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al eliminar')
    })
  })

  describe('restoreSensei', () => {
    it('debe restaurar un sensei correctamente', async () => {
      ;(senseiService.restore as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockSensei, activo: true },
      })

      const result = await senseiController.restoreSensei('1')

      expect(result.success).toBe(true)
      expect(result.data?.activo).toBe(true)
      expect(senseiService.restore).toHaveBeenCalledWith('1')
    })

    it('debe retornar error cuando no se proporciona ID', async () => {
      const result = await senseiController.restoreSensei('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID del sensei es requerido')
      expect(senseiService.restore).not.toHaveBeenCalled()
    })

    it('debe propagar errores del servicio', async () => {
      ;(senseiService.restore as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error al restaurar',
      })

      const result = await senseiController.restoreSensei('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al restaurar')
    })
  })
})