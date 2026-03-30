import { certificacionService } from '../certificacionService'
import { createClient } from '@/lib/supabase/client'
import { Certificacion, CertificacionCreate, CertificacionUpdate } from '@/models/certificacion'

// Mock de Supabase
const mockSupabaseInstance = {
  from: jest.fn()
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseInstance)
}))

describe('certificacionService', () => {
  const mockSupabase = mockSupabaseInstance as unknown as any
  const mockCertificacion: Certificacion = {
    id: 'cert-123',
    usuario_id: 'user-456',
    tipo_afiliado: 'sensei',
    nombre_certificacion: 'Certificación Nacional de Judo',
    descripcion: 'Certificación emitida por la Federación Nacional de Judo',
    fecha_emision: '2024-01-15',
    fecha_vencimiento: '2025-01-15',
    archivo_url: 'https://storage.supabase.co/cert-123.pdf',
    activo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('debe obtener todas las certificaciones', async () => {
      const mockCertificaciones = [mockCertificacion]
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCertificaciones,
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCertificaciones)
      expect(mockSupabase.from).toHaveBeenCalledWith('certificaciones')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.order).toHaveBeenCalledWith('fecha_emision', { ascending: false })
    })

    it('debe filtrar por activo cuando se proporciona', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [mockCertificacion],
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.getAll(true)

      expect(result.success).toBe(true)
      expect(mockQuery.eq).toHaveBeenCalledWith('activo', true)
    })

    it('debe manejar errores al obtener certificaciones', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(
          new Error('Error de base de datos')
        )
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.getAll()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de base de datos')
    })
  })

  describe('getByUsuario', () => {
    it('debe obtener certificaciones por usuario', async () => {
      const usuarioId = 'user-456'
      const mockCertificaciones = [mockCertificacion]
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCertificaciones,
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.getByUsuario(usuarioId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCertificaciones)
      expect(mockQuery.eq).toHaveBeenCalledWith('usuario_id', usuarioId)
      expect(mockQuery.order).toHaveBeenCalledWith('fecha_emision', { ascending: false })
    })

    it('debe filtrar por tipo de afiliado cuando se proporciona', async () => {
      const usuarioId = 'user-456'
      const tipoAfiliado = 'sensei'
      
      // Necesitamos simular la cadena de llamadas del query builder
      let queryChain: any = {
        select: jest.fn(),
        eq: jest.fn(),
        order: jest.fn()
      }
      
      queryChain.select.mockReturnValue(queryChain)
      queryChain.eq.mockReturnValue(queryChain)
      queryChain.order.mockReturnValue(queryChain)

      // El await final debe retornar los datos
      // Simulamos que el objeto queryChain es thenable
      queryChain.then = function(resolve: any) {
        resolve({ data: [mockCertificacion], error: null })
        return this
      }

      mockSupabase.from = jest.fn().mockReturnValue(queryChain)

      const result = await certificacionService.getByUsuario(usuarioId, tipoAfiliado)

      expect(result.success).toBe(true)
      expect(queryChain.eq).toHaveBeenCalledWith('usuario_id', usuarioId)
      expect(queryChain.eq).toHaveBeenCalledWith('tipo_afiliado', tipoAfiliado)
    })

    it('debe manejar errores al obtener certificaciones por usuario', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(
          new Error('Usuario no encontrado')
        )
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.getByUsuario('user-456')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Usuario no encontrado')
    })
  })

  describe('getById', () => {
    it('debe obtener una certificación por ID', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCertificacion,
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.getById('cert-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCertificacion)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'cert-123')
      expect(mockQuery.single).toHaveBeenCalled()
    })

    it('debe manejar errores al obtener certificación por ID', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(
          new Error('Certificación no encontrada')
        )
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.getById('cert-999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Certificación no encontrada')
    })
  })

  describe('create', () => {
    it('debe crear una nueva certificación', async () => {
      const nuevaCertificacion: CertificacionCreate = {
        usuario_id: 'user-456',
        tipo_afiliado: 'sensei',
        nombre_certificacion: 'Certificación Nacional de Judo',
        descripcion: 'Certificación emitida por la Federación Nacional de Judo',
        fecha_emision: '2024-01-15',
        fecha_vencimiento: '2025-01-15',
        activo: true
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCertificacion,
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.create(nuevaCertificacion)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCertificacion)
      expect(mockQuery.insert).toHaveBeenCalledWith(nuevaCertificacion)
    })

    it('debe manejar errores al crear certificación', async () => {
      const nuevaCertificacion: CertificacionCreate = {
        usuario_id: 'user-456',
        tipo_afiliado: 'sensei',
        nombre_certificacion: 'Certificación Nacional de Judo',
        descripcion: 'Certificación emitida por la Federación Nacional de Judo',
        fecha_emision: '2024-01-15'
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(
          new Error('Error al insertar certificación')
        )
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.create(nuevaCertificacion)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al insertar certificación')
    })
  })

  describe('update', () => {
    it('debe actualizar una certificación', async () => {
      const actualizacion: CertificacionUpdate = {
        nombre_certificacion: 'Certificación Internacional de Judo',
        descripcion: 'Certificación emitida por la Federación Internacional de Judo'
      }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockCertificacion, ...actualizacion },
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.update('cert-123', actualizacion)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject(actualizacion)
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...actualizacion,
          updated_at: expect.any(String)
        })
      )
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'cert-123')
    })

    it('debe manejar errores al actualizar certificación', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(
          new Error('Certificación no encontrada')
        )
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.update('cert-999', {})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Certificación no encontrada')
    })
  })

  describe('delete', () => {
    it('debe desactivar una certificación (soft delete)', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.delete('cert-123')

      expect(result.success).toBe(true)
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          activo: false,
          updated_at: expect.any(String)
        })
      )
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'cert-123')
    })

    it('debe manejar errores al desactivar certificación', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(
          new Error('Error al desactivar')
        )
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.delete('cert-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al desactivar')
    })
  })

  describe('deletePermanent', () => {
    it('debe eliminar permanentemente una certificación', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.deletePermanent('cert-123')

      expect(result.success).toBe(true)
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'cert-123')
    })

    it('debe manejar errores al eliminar permanentemente', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(
          new Error('Error al eliminar')
        )
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await certificacionService.deletePermanent('cert-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al eliminar')
    })
  })
})

