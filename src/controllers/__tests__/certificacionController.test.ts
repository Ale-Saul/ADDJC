import { certificacionController } from '../certificacionController'
import { certificacionService } from '@/services/certificacionService'
import { Certificacion, CertificacionCreate, CertificacionUpdate } from '@/models/certificacion'

// Mock del servicio
jest.mock('@/services/certificacionService')

describe('certificacionController', () => {
  const mockedService = certificacionService as jest.Mocked<typeof certificacionService>

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

  describe('getAllCertificaciones', () => {
    it('debe obtener todas las certificaciones', async () => {
      mockedService.getAll.mockResolvedValue({
        success: true,
        data: [mockCertificacion]
      })

      const result = await certificacionController.getAllCertificaciones()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockCertificacion])
      expect(mockedService.getAll).toHaveBeenCalledWith(undefined)
    })

    it('debe pasar el filtro activo al servicio', async () => {
      mockedService.getAll.mockResolvedValue({
        success: true,
        data: [mockCertificacion]
      })

      await certificacionController.getAllCertificaciones(true)

      expect(mockedService.getAll).toHaveBeenCalledWith(true)
    })
  })

  describe('getCertificacionesByUsuario', () => {
    it('debe obtener certificaciones por usuario', async () => {
      mockedService.getByUsuario.mockResolvedValue({
        success: true,
        data: [mockCertificacion]
      })

      const result = await certificacionController.getCertificacionesByUsuario('user-456')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockCertificacion])
      expect(mockedService.getByUsuario).toHaveBeenCalledWith('user-456', undefined)
    })

    it('debe validar que el ID de usuario sea requerido', async () => {
      const result = await certificacionController.getCertificacionesByUsuario('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('El ID de usuario es requerido')
      expect(mockedService.getByUsuario).not.toHaveBeenCalled()
    })

    it('debe pasar el tipo de afiliado al servicio', async () => {
      mockedService.getByUsuario.mockResolvedValue({
        success: true,
        data: [mockCertificacion]
      })

      await certificacionController.getCertificacionesByUsuario('user-456', 'sensei')

      expect(mockedService.getByUsuario).toHaveBeenCalledWith('user-456', 'sensei')
    })
  })

  describe('getCertificacionById', () => {
    it('debe obtener una certificación por ID', async () => {
      mockedService.getById.mockResolvedValue({
        success: true,
        data: mockCertificacion
      })

      const result = await certificacionController.getCertificacionById('cert-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCertificacion)
      expect(mockedService.getById).toHaveBeenCalledWith('cert-123')
    })

    it('debe validar que el ID sea requerido', async () => {
      const result = await certificacionController.getCertificacionById('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('El ID de la certificación es requerido')
      expect(mockedService.getById).not.toHaveBeenCalled()
    })
  })

  describe('createCertificacion', () => {
    const nuevaCertificacion: CertificacionCreate = {
      usuario_id: 'user-456',
      tipo_afiliado: 'sensei',
      nombre_certificacion: 'Certificación Nacional de Judo',
      descripcion: 'Certificación emitida por la Federación Nacional de Judo',
      fecha_emision: '2024-01-15'
    }

    it('debe crear una nueva certificación', async () => {
      mockedService.create.mockResolvedValue({
        success: true,
        data: mockCertificacion
      })

      const result = await certificacionController.createCertificacion(nuevaCertificacion)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCertificacion)
      expect(mockedService.create).toHaveBeenCalledWith({
        ...nuevaCertificacion,
        activo: true
      })
    })

    it('debe validar que el usuario_id sea requerido', async () => {
      const certificacionSinUsuario = { ...nuevaCertificacion, usuario_id: '' }

      const result = await certificacionController.createCertificacion(certificacionSinUsuario)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El ID de usuario es requerido')
      expect(mockedService.create).not.toHaveBeenCalled()
    })

    it('debe validar que el tipo_afiliado sea requerido', async () => {
      const certificacionSinTipo = { ...nuevaCertificacion, tipo_afiliado: '' as any }

      const result = await certificacionController.createCertificacion(certificacionSinTipo)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El tipo de afiliado es requerido')
      expect(mockedService.create).not.toHaveBeenCalled()
    })

    it('debe validar que el nombre_certificacion sea requerido', async () => {
      const certificacionSinNombre = { ...nuevaCertificacion, nombre_certificacion: '' }

      const result = await certificacionController.createCertificacion(certificacionSinNombre)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre de la certificación es requerido')
      expect(mockedService.create).not.toHaveBeenCalled()
    })

    it('debe validar que el nombre_certificacion no esté vacío (solo espacios)', async () => {
      const certificacionNombreVacio = { ...nuevaCertificacion, nombre_certificacion: '   ' }

      const result = await certificacionController.createCertificacion(certificacionNombreVacio)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre de la certificación es requerido')
      expect(mockedService.create).not.toHaveBeenCalled()
    })

    it('debe establecer activo como true por defecto', async () => {
      mockedService.create.mockResolvedValue({
        success: true,
        data: mockCertificacion
      })

      await certificacionController.createCertificacion(nuevaCertificacion)

      expect(mockedService.create).toHaveBeenCalledWith(
        expect.objectContaining({ activo: true })
      )
    })

    it('debe respetar el valor de activo si se proporciona', async () => {
      const certificacionInactiva = { ...nuevaCertificacion, activo: false }

      mockedService.create.mockResolvedValue({
        success: true,
        data: { ...mockCertificacion, activo: false }
      })

      await certificacionController.createCertificacion(certificacionInactiva)

      expect(mockedService.create).toHaveBeenCalledWith(
        expect.objectContaining({ activo: false })
      )
    })
  })

  describe('updateCertificacion', () => {
    const actualizacion: CertificacionUpdate = {
      nombre_certificacion: 'Certificación Actualizada',
      descripcion: 'Nueva descripción'
    }

    it('debe actualizar una certificación', async () => {
      mockedService.update.mockResolvedValue({
        success: true,
        data: { ...mockCertificacion, ...actualizacion }
      })

      const result = await certificacionController.updateCertificacion('cert-123', actualizacion)

      expect(result.success).toBe(true)
      expect(mockedService.update).toHaveBeenCalledWith('cert-123', actualizacion)
    })

    it('debe validar que el ID sea requerido', async () => {
      const result = await certificacionController.updateCertificacion('', actualizacion)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El ID de la certificación es requerido')
      expect(mockedService.update).not.toHaveBeenCalled()
    })

    it('debe validar que el nombre no esté vacío si se proporciona', async () => {
      const actualizacionNombreVacio = { nombre_certificacion: '   ' }

      const result = await certificacionController.updateCertificacion('cert-123', actualizacionNombreVacio)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre de la certificación no puede estar vacío')
      expect(mockedService.update).not.toHaveBeenCalled()
    })

    it('debe permitir actualizar otros campos sin nombre', async () => {
      const actualizacionSinNombre = { descripcion: 'Nueva descripción' }

      mockedService.update.mockResolvedValue({
        success: true,
        data: { ...mockCertificacion, descripcion: 'Nueva descripción' }
      })

      const result = await certificacionController.updateCertificacion('cert-123', actualizacionSinNombre)

      expect(result.success).toBe(true)
      expect(mockedService.update).toHaveBeenCalledWith('cert-123', actualizacionSinNombre)
    })
  })

  describe('deleteCertificacion', () => {
    it('debe desactivar una certificación', async () => {
      mockedService.delete.mockResolvedValue({ success: true })

      const result = await certificacionController.deleteCertificacion('cert-123')

      expect(result.success).toBe(true)
      expect(mockedService.delete).toHaveBeenCalledWith('cert-123')
    })

    it('debe validar que el ID sea requerido', async () => {
      const result = await certificacionController.deleteCertificacion('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('El ID de la certificación es requerido')
      expect(mockedService.delete).not.toHaveBeenCalled()
    })
  })

  describe('deleteCertificacionPermanent', () => {
    it('debe eliminar permanentemente una certificación', async () => {
      mockedService.deletePermanent.mockResolvedValue({ success: true })

      const result = await certificacionController.deleteCertificacionPermanent('cert-123')

      expect(result.success).toBe(true)
      expect(mockedService.deletePermanent).toHaveBeenCalledWith('cert-123')
    })

    it('debe validar que el ID sea requerido', async () => {
      const result = await certificacionController.deleteCertificacionPermanent('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('El ID de la certificación es requerido')
      expect(mockedService.deletePermanent).not.toHaveBeenCalled()
    })
  })
})
