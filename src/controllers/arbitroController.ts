import { arbitroService } from '@/services/arbitroService'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { ApiResponse } from '@/types'

export const arbitroController = {
  /**
   * Obtener todos los árbitros
   */
  async getAllArbitros(includeInactive: boolean = false): Promise<ApiResponse<Arbitro[]>> {
    return await arbitroService.getAll(includeInactive)
  },

  /**
   * Obtener un árbitro por ID
   */
  async getArbitroById(id: string): Promise<ApiResponse<Arbitro>> {
    if (!id) {
      return { success: false, error: 'ID del árbitro es requerido' }
    }

    return await arbitroService.getById(id)
  },

  /**
   * Crear un nuevo árbitro
   */
  async createArbitro(arbitroData: ArbitroCreate): Promise<ApiResponse<Arbitro>> {
    // Validaciones de negocio
    if (!arbitroData.nombres || arbitroData.nombres.trim() === '') {
      return { success: false, error: 'El nombre es requerido' }
    }

    if (!arbitroData.apellidos || arbitroData.apellidos.trim() === '') {
      return { success: false, error: 'Los apellidos son requeridos' }
    }

    if (arbitroData.nombres.length < 2) {
      return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
    }

    if (arbitroData.apellidos.length < 2) {
      return { success: false, error: 'Los apellidos deben tener al menos 2 caracteres' }
    }

    if (arbitroData.nombres.length > 100) {
      return { success: false, error: 'El nombre no puede exceder 100 caracteres' }
    }

    if (arbitroData.apellidos.length > 100) {
      return { success: false, error: 'Los apellidos no pueden exceder 100 caracteres' }
    }

    // Por defecto, el árbitro se crea como activo
    const arbitroToCreate: ArbitroCreate = {
      ...arbitroData,
      activo: arbitroData.activo !== undefined ? arbitroData.activo : true
    }

    return await arbitroService.create(arbitroToCreate)
  },

  /**
   * Actualizar un árbitro
   */
  async updateArbitro(id: string, arbitroData: ArbitroUpdate): Promise<ApiResponse<Arbitro>> {
    if (!id) {
      return { success: false, error: 'ID del árbitro es requerido' }
    }

    // Validar que el árbitro existe
    const existingArbitro = await arbitroService.getById(id)
    if (!existingArbitro.success || !existingArbitro.data) {
      return { success: false, error: 'Árbitro no encontrado' }
    }

    // Validaciones de negocio
    if (arbitroData.nombres !== undefined) {
      if (arbitroData.nombres.trim() === '') {
        return { success: false, error: 'El nombre no puede estar vacío' }
      }

      if (arbitroData.nombres.length < 2) {
        return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
      }

      if (arbitroData.nombres.length > 100) {
        return { success: false, error: 'El nombre no puede exceder 100 caracteres' }
      }
    }

    if (arbitroData.apellidos !== undefined) {
      if (arbitroData.apellidos.trim() === '') {
        return { success: false, error: 'Los apellidos no pueden estar vacíos' }
      }

      if (arbitroData.apellidos.length < 2) {
        return { success: false, error: 'Los apellidos deben tener al menos 2 caracteres' }
      }

      if (arbitroData.apellidos.length > 100) {
        return { success: false, error: 'Los apellidos no pueden exceder 100 caracteres' }
      }
    }

    return await arbitroService.update(id, arbitroData)
  },

  /**
   * Eliminar un árbitro (soft delete)
   */
  async deleteArbitro(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'ID del árbitro es requerido' }
    }

    // Validar que el árbitro existe
    const existingArbitro = await arbitroService.getById(id)
    if (!existingArbitro.success || !existingArbitro.data) {
      return { success: false, error: 'Árbitro no encontrado' }
    }

    return await arbitroService.delete(id)
  },

  /**
   * Restaurar un árbitro
   */
  async restoreArbitro(id: string): Promise<ApiResponse<Arbitro>> {
    if (!id) {
      return { success: false, error: 'ID del árbitro es requerido' }
    }

    return await arbitroService.restore(id)
  }
}

