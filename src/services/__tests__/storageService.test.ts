const { storageService } = require('../storageService')

// Mock global de la funci�n createClient para inyectar el mock de storage
const mockStorage = {
  from: jest.fn().mockReturnThis(),
  upload: jest.fn(),
  remove: jest.fn(),
  getPublicUrl: jest.fn(),
  createSignedUrl: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: mockStorage
  })
}))

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage.from.mockReturnThis()
  })

  describe('uploadFile', () => {
    it('debe subir un archivo PDF exitosamente', async () => {
      const file = { name: 'test.pdf', type: 'application/pdf', size: 1024 }
      mockStorage.upload.mockResolvedValueOnce({ data: { path: 'test/path' }, error: null })

      const result = await storageService.uploadFile(file, 'bucket', 'test/path')

      expect(result.success).toBe(true)
      expect(result.url).toBe('test/path')
    })

    it('debe manejar error de Supabase al subir archivo', async () => {
        const file = { name: 'test.pdf', type: 'application/pdf', size: 1024 }
        mockStorage.upload.mockResolvedValueOnce({ data: null, error: { message: 'Error de Supabase' } })
  
        const result = await storageService.uploadFile(file, 'bucket', 'path')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Error de Supabase')
    })

    it('debe manejar excepcion catch al subir archivo', async () => {
        const file = { name: 'test.pdf', type: 'application/pdf', size: 1024 }
        mockStorage.from.mockImplementationOnce(() => { throw new Error('Crash') })
  
        const result = await storageService.uploadFile(file, 'bucket', 'path')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Crash')
    })

    it('debe rechazar archivos con tipos no permitidos', async () => {
      const file = { name: 'test.exe', type: 'application/x-msdownload', size: 1024 }
      const result = await storageService.uploadFile(file, 'bucket', 'test/path')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Tipo de archivo no permitido')
    })

    it('debe rechazar archivos que excedan el tama�o m�ximo', async () => {
      const bigFile = { size: 11 * 1024 * 1024, type: 'application/pdf' }
      const result = await storageService.uploadFile(bigFile, 'bucket', 'test/path')
      expect(result.success).toBe(false)
      expect(result.error).toContain('demasiado grande')
    })
  })

  describe('deleteFile', () => {
    it('debe eliminar un archivo del storage exitosamente', async () => {
      mockStorage.remove.mockResolvedValueOnce({ data: [], error: null })
      const result = await storageService.deleteFile('bucket', 'path')
      expect(result.success).toBe(true)
    })

    it('debe manejar errores al eliminar un archivo', async () => {
      mockStorage.remove.mockResolvedValueOnce({ data: null, error: { message: 'Error al borrar' } })
      const result = await storageService.deleteFile('bucket', 'path')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al borrar')
    })

    it('debe manejar excepcion catch al eliminar', async () => {
        mockStorage.from.mockImplementationOnce(() => { throw new Error('Crash Delete') })
        const result = await storageService.deleteFile('bucket', 'path')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Crash Delete')
    })
  })

  describe('getPublicUrl', () => {
    it('debe devolver la URL p�blica correctamente', () => {
      mockStorage.getPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'http://url.com' } })
      const url = storageService.getPublicUrl('bucket', 'path')
      expect(url).toBe('http://url.com')
    })
  })

  describe('getSignedUrl', () => {
    it('debe obtener una URL firmada exitosamente', async () => {
      mockStorage.createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'http://signed.com' }, error: null })
      const result = await storageService.getSignedUrl('bucket', 'path')
      expect(result.success).toBe(true)
      expect(result.url).toBe('http://signed.com')
    })

    it('debe manejar errores al obtener URL firmada', async () => {
      mockStorage.createSignedUrl.mockResolvedValueOnce({ data: null, error: { message: 'Error firmado' } })
      const result = await storageService.getSignedUrl('bucket', 'path')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error firmado')
    })

    it('debe manejar excepcion catch al firmar', async () => {
        mockStorage.from.mockImplementationOnce(() => { throw new Error('Crash Sign') })
        const result = await storageService.getSignedUrl('bucket', 'path')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Crash Sign')
    })
  })
})
