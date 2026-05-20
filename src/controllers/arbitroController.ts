import { arbitroService } from '@/services/arbitroService'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { ApiResponse } from '@/types/globales'
import { generarPasswordInicial } from '@/utils/passwordUtils'
import { personNamesCreateSchema, personNamesUpdateSchema } from '@/schemas/globales'


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
    const namesValidation = personNamesCreateSchema.safeParse(arbitroData)
    if (!namesValidation.success) {
      return { success: false, error: namesValidation.error.issues[0]?.message ?? 'Error de validación' }
    }

    // Generar contraseña automática basada en el carnet
    const autoPassword = generarPasswordInicial(arbitroData.ci || '', arbitroData.ci_extension)

    // Por defecto, el árbitro se crea como activo
    const arbitroToCreate: ArbitroCreate = {
      ...arbitroData,
      password: autoPassword,
      activo: arbitroData.activo !== undefined ? arbitroData.activo : true
    }

    return await arbitroService.create(arbitroToCreate)
  },

  /**
   * Actualizar un árbitro
   */
  async updateArbitro(id: string, arbitroData: ArbitroUpdate & { updated_by?: string }): Promise<ApiResponse<Arbitro>> {
    if (!id) {
      return { success: false, error: 'ID del árbitro es requerido' }
    }

    // Validar que el árbitro existe
    const existingArbitro = await arbitroService.getById(id)
    if (!existingArbitro.success || !existingArbitro.data) {
      return { success: false, error: 'Árbitro no encontrado' }
    }

    const namesValidation = personNamesUpdateSchema.safeParse(arbitroData)
    if (!namesValidation.success) {
      return { success: false, error: namesValidation.error.issues[0]?.message ?? 'Error de validación' }
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

