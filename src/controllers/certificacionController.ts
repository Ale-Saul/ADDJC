import { certificacionService } from '@/services/certificacionService'
import { Certificacion, CertificacionCreate, CertificacionUpdate } from '@/models/certificacion'
import { certificacionSchema } from '@/schemas/globales'

import { ApiResponse } from '@/types/globales'

export const certificacionController = {
  /**
   * Obtener todas las certificaciones
   */
  async getAllCertificaciones(activo?: boolean): Promise<ApiResponse<Certificacion[]>> {
    return await certificacionService.getAll(activo)
  },

  /**
   * Obtener certificaciones por usuario
   */
  async getCertificacionesByUsuario(
    usuarioId: string,
    tipoAfiliado?: 'sensei' | 'arbitro'
  ): Promise<ApiResponse<Certificacion[]>> {
    if (!usuarioId) {
      return { success: false, error: 'El ID de usuario es requerido' }
    }

    return await certificacionService.getByUsuario(usuarioId, tipoAfiliado)
  },

  /**
   * Obtener una certificación por ID
   */
  async getCertificacionById(id: string): Promise<ApiResponse<Certificacion>> {
    if (!id) {
      return { success: false, error: 'El ID de la certificación es requerido' }
    }

    return await certificacionService.getById(id)
  },

  /**
   * Crear una nueva certificación
   */
  async createCertificacion(certificacion: CertificacionCreate): Promise<ApiResponse<Certificacion>> {
    const validation = certificacionSchema.safeParse(certificacion)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Error de validación en certificación' }
    }

    return await certificacionService.create({
      ...certificacion,
      activo: certificacion.activo ?? true
    })
  },

  /**
   * Actualizar una certificación
   */
  async updateCertificacion(
    id: string,
    certificacion: CertificacionUpdate
  ): Promise<ApiResponse<Certificacion>> {
    if (!id) {
      return { success: false, error: 'El ID de la certificación es requerido' }
    }

    if (certificacion.nombre_certificacion !== undefined && certificacion.nombre_certificacion.trim() === '') {
      return { success: false, error: 'El nombre de la certificación no puede estar vacío' }
    }

    return await certificacionService.update(id, certificacion)
  },

  /**
   * Eliminar una certificación (soft delete)
   */
  async deleteCertificacion(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'El ID de la certificación es requerido' }
    }

    return await certificacionService.delete(id)
  },

  /**
   * Eliminar permanentemente una certificación
   */
  async deleteCertificacionPermanent(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'El ID de la certificación es requerido' }
    }

    return await certificacionService.deletePermanent(id)
  }
}

