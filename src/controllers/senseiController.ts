import { senseiService } from '@/services/senseiService'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { ApiResponse } from '@/types/globales'
import { generarPasswordInicial } from '@/utils/passwordUtils'
import { personNamesCreateSchema, personNamesUpdateSchema } from '@/schemas/globales'

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
    const validation = personNamesCreateSchema.safeParse(senseiData)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Error de validación' }
    }

    // Generar contraseña automática basada en el carnet
    const autoPassword = generarPasswordInicial(senseiData.ci || '', senseiData.ci_extension)

    // Por defecto, el sensei se crea como activo
    const senseiToCreate: SenseiCreate = {
      ...senseiData,
      password: autoPassword,
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

    const validation = personNamesUpdateSchema.safeParse(senseiData)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Error de validación' }
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

