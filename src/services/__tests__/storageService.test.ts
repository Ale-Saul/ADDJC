import { storageService } from '../storageService'

// Instancia mock de Supabase
const mockSupabaseInstance = {
  storage: {
    from: jest.fn(),
  },
}

// Mock de Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseInstance)
}))

describe('storageService', () => {
  let mockStorage: any

  const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
  const mockImageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

  beforeEach(() => {
    jest.clearAllMocks()

    mockStorage = {
      upload: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    }

    ;(mockSupabaseInstance.storage.from as jest.Mock).mockReturnValue(mockStorage)
  })

  describe('uploadFile', () => {
    it('debe subir un archivo PDF exitosamente', async () => {
      const mockUrl = 'https://example.com/test.pdf'
      mockStorage.upload.mockResolvedValue({ data: { path: 'test.pdf' }, error: null })
      mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: mockUrl } })

      const result = await storageService.uploadFile(mockFile, 'certificaciones', 'test.pdf')

      expect(result.success).toBe(true)
      expect(result.url).toBe(mockUrl)
      expect(mockStorage.upload).toHaveBeenCalledWith('test.pdf', mockFile, {
        cacheControl: '3600',
        upsert: false,
      })
    })

    it('debe subir una imagen exitosamente', async () => {
      const mockUrl = 'https://example.com/test.jpg'
      mockStorage.upload.mockResolvedValue({ data: { path: 'test.jpg' }, error: null })
      mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: mockUrl } })

      const result = await storageService.uploadFile(mockImageFile, 'avatars', 'test.jpg')

      expect(result.success).toBe(true)
      expect(result.url).toBe(mockUrl)
    })

    it('debe rechazar archivos con tipo no permitido', async () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })

      const result = await storageService.uploadFile(invalidFile, 'certificaciones', 'test.txt')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Tipo de archivo no permitido')
      expect(mockStorage.upload).not.toHaveBeenCalled()
    })

    it('debe rechazar archivos que excedan 10MB', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      })

      const result = await storageService.uploadFile(largeFile, 'certificaciones', 'large.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toContain('demasiado grande')
      expect(result.error).toContain('10MB')
      expect(mockStorage.upload).not.toHaveBeenCalled()
    })

    it('debe manejar archivos duplicados con nombre único', async () => {
      const duplicateError = { message: 'The resource already exists' }
      const mockUrl = 'https://example.com/test_123456.pdf'

      // Primera llamada falla por duplicado
      mockStorage.upload
        .mockResolvedValueOnce({ data: null, error: duplicateError })
        .mockResolvedValueOnce({ data: { path: 'test_123456.pdf' }, error: null })

      mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: mockUrl } })

      // Mock Date.now para tener timestamp predecible
      const mockTimestamp = 123456
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp)

      const result = await storageService.uploadFile(mockFile, 'certificaciones', 'test.pdf')

      expect(result.success).toBe(true)
      expect(result.url).toBe(mockUrl)
      expect(mockStorage.upload).toHaveBeenCalledTimes(2)

      // Restaurar Date.now
      jest.restoreAllMocks()
    })

    it('debe manejar errores de subida', async () => {
      mockStorage.upload.mockResolvedValue({ 
        data: null, 
        error: { message: 'Storage error' } 
      })

      const result = await storageService.uploadFile(mockFile, 'certificaciones', 'test.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage error')
    })

    it('debe manejar errores en reintentos de archivos duplicados', async () => {
      const duplicateError = { message: 'The resource already exists' }
      const retryError = { message: 'Upload failed on retry' }

      mockStorage.upload
        .mockResolvedValueOnce({ data: null, error: duplicateError })
        .mockResolvedValueOnce({ data: null, error: retryError })

      const result = await storageService.uploadFile(mockFile, 'certificaciones', 'test.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Upload failed on retry')
    })

    it('debe manejar excepciones inesperadas', async () => {
      mockStorage.upload.mockRejectedValue(new Error('Unexpected error'))

      const result = await storageService.uploadFile(mockFile, 'certificaciones', 'test.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unexpected error')
    })

    it('debe aceptar diferentes tipos de imágenes', async () => {
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      
      for (const type of imageTypes) {
        mockStorage.upload.mockResolvedValue({ data: { path: 'test' }, error: null })
        mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/test' } })

        const file = new File(['content'], `test.${type.split('/')[1]}`, { type })
        const result = await storageService.uploadFile(file, 'avatars', 'test')

        expect(result.success).toBe(true)
      }
    })
  })

  describe('deleteFile', () => {
    it('debe eliminar un archivo exitosamente', async () => {
      mockStorage.remove.mockResolvedValue({ data: null, error: null })

      const result = await storageService.deleteFile('certificaciones', 'test.pdf')

      expect(result.success).toBe(true)
      expect(mockStorage.remove).toHaveBeenCalledWith(['test.pdf'])
    })

    it('debe manejar errores al eliminar', async () => {
      mockStorage.remove.mockResolvedValue({ 
        data: null, 
        error: { message: 'File not found' } 
      })

      const result = await storageService.deleteFile('certificaciones', 'nonexistent.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toBe('File not found')
    })

    it('debe manejar excepciones al eliminar', async () => {
      mockStorage.remove.mockRejectedValue(new Error('Delete error'))

      const result = await storageService.deleteFile('certificaciones', 'test.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Delete error')
    })
  })

  describe('getPublicUrl', () => {
    it('debe obtener la URL pública de un archivo', () => {
      const mockUrl = 'https://example.com/bucket/file.pdf'
      mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: mockUrl } })

      const url = storageService.getPublicUrl('certificaciones', 'file.pdf')

      expect(url).toBe(mockUrl)
      expect(mockSupabaseInstance.storage.from).toHaveBeenCalledWith('certificaciones')
      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith('file.pdf')
    })

    it('debe manejar diferentes buckets y rutas', () => {
      const testCases = [
        { bucket: 'avatars', path: 'user/123/avatar.jpg', url: 'https://example.com/avatars/user/123/avatar.jpg' },
        { bucket: 'certificaciones', path: 'cert/456/doc.pdf', url: 'https://example.com/certificaciones/cert/456/doc.pdf' },
      ]

      testCases.forEach(({ bucket, path, url }) => {
        mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: url } })
        
        const result = storageService.getPublicUrl(bucket, path)
        
        expect(result).toBe(url)
        expect(mockSupabaseInstance.storage.from).toHaveBeenCalledWith(bucket)
        expect(mockStorage.getPublicUrl).toHaveBeenCalledWith(path)
      })
    })
  })
})
