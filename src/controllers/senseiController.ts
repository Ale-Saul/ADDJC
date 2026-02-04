import { senseiService } from '@/services/senseiService'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { ApiResponse } from '@/types'

export const senseiController = {
  /**
   * Obtener todos los senseis
   */
  async getAllSenseis(includeInactive: boolean = false): Promise<ApiResponse<Sensei[]>> {
    return await senseiService.getAll(includeInactive)
  },

  /**
   * Obtener senseis por club
   */
  async getSenseisByClub(clubId: string): Promise<ApiResponse<Sensei[]>> {
    if (!clubId) {
      return { success: false, error: 'ID del club es requerido' }
    }

    return await senseiService.getByClub(clubId)
  },

  /**
   * Obtener un sensei por ID
   */
  async getSenseiById(id: string): Promise<ApiResponse<Sensei>> {
    if (!id) {
      return { success: false, error: 'ID del sensei es requerido' }
    }

    return await senseiService.getById(id)
  },

  /**
   * Crear un nuevo sensei
   */
  async createSensei(senseiData: SenseiCreate): Promise<ApiResponse<Sensei>> {
    // Validaciones de negocio
    if (!senseiData.nombres || senseiData.nombres.trim() === '') {
      return { success: false, error: 'El nombre es requerido' }
    }

    if (!senseiData.apellidos || senseiData.apellidos.trim() === '') {
      return { success: false, error: 'Los apellidos son requeridos' }
    }

    if (senseiData.nombres.length < 2) {
      return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
    }

    if (senseiData.apellidos.length < 2) {
      return { success: false, error: 'Los apellidos deben tener al menos 2 caracteres' }
    }

    if (senseiData.nombres.length > 100) {
      return { success: false, error: 'El nombre no puede exceder 100 caracteres' }
    }

    if (senseiData.apellidos.length > 100) {
      return { success: false, error: 'Los apellidos no pueden exceder 100 caracteres' }
    }

    // Por defecto, el sensei se crea como activo
    const senseiToCreate: SenseiCreate = {
      ...senseiData,
      activo: senseiData.activo !== undefined ? senseiData.activo : true
    }

    return await senseiService.create(senseiToCreate)
  },

  /**
   * Actualizar un sensei
   */
  async updateSensei(id: string, senseiData: SenseiUpdate): Promise<ApiResponse<Sensei>> {
    if (!id) {
      return { success: false, error: 'ID del sensei es requerido' }
    }

    // Validar que el sensei existe
    const existingSensei = await senseiService.getById(id)
    if (!existingSensei.success || !existingSensei.data) {
      return { success: false, error: 'Sensei no encontrado' }
    }

    // Validaciones de negocio
    if (senseiData.nombres !== undefined) {
      if (senseiData.nombres.trim() === '') {
        return { success: false, error: 'El nombre no puede estar vacío' }
      }

      if (senseiData.nombres.length < 2) {
        return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
      }

      if (senseiData.nombres.length > 100) {
        return { success: false, error: 'El nombre no puede exceder 100 caracteres' }
      }
    }

    if (senseiData.apellidos !== undefined) {
      if (senseiData.apellidos.trim() === '') {
        return { success: false, error: 'Los apellidos no pueden estar vacíos' }
      }

      if (senseiData.apellidos.length < 2) {
        return { success: false, error: 'Los apellidos deben tener al menos 2 caracteres' }
      }

      if (senseiData.apellidos.length > 100) {
        return { success: false, error: 'Los apellidos no pueden exceder 100 caracteres' }
      }
    }

    return await senseiService.update(id, senseiData)
  },

  /**
   * Eliminar un sensei (soft delete)
   */
  async deleteSensei(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'ID del sensei es requerido' }
    }

    // Validar que el sensei existe
    const existingSensei = await senseiService.getById(id)
    if (!existingSensei.success || !existingSensei.data) {
      return { success: false, error: 'Sensei no encontrado' }
    }

    return await senseiService.delete(id)
  },

  /**
   * Restaurar un sensei
   */
  async restoreSensei(id: string): Promise<ApiResponse<Sensei>> {
    if (!id) {
      return { success: false, error: 'ID del sensei es requerido' }
    }

    return await senseiService.restore(id)
  }
}

