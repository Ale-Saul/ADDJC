import { asociacionService } from '@/services/asociacionService'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'
import { ApiResponse } from '@/types/globales'
import { generarPasswordInicial } from '@/utils/passwordUtils'
import { personNamesCreateSchema, personNamesUpdateSchema, emailSchema } from '@/schemas/globales'


export const asociacionController = {
  /**
   * Obtener todos los miembros de la asociación
   */
  async getAllMiembros(includeInactive: boolean = false): Promise<ApiResponse<MiembroAsociacion[]>> {
    return await asociacionService.getAll(includeInactive)
  },

  /**
   * Obtener un miembro por ID
   */
  async getMiembroById(id: string): Promise<ApiResponse<MiembroAsociacion>> {
    if (!id) {
      return { success: false, error: 'ID del miembro es requerido' }
    }

    return await asociacionService.getById(id)
  },

  /**
   * Crear un nuevo miembro de la asociación
   */
  async createMiembro(miembroData: MiembroAsociacionCreate): Promise<ApiResponse<MiembroAsociacion>> {
    const namesValidation = personNamesCreateSchema.safeParse(miembroData)
    if (!namesValidation.success) {
      return { success: false, error: namesValidation.error.issues[0]?.message ?? 'Error de validación de nombres' }
    }

    const emailValidation = emailSchema.safeParse(miembroData.email)
    if (!emailValidation.success) {
      return { success: false, error: emailValidation.error.issues[0]?.message ?? 'Error de validación de email' }
    }

    const miembroToCreate: MiembroAsociacionCreate = {
      ...miembroData,
      password: miembroData.password || generarPasswordInicial(miembroData.ci || '', miembroData.ci_extension)
    }

    return await asociacionService.create(miembroToCreate)
  },

  /**
   * Actualizar un miembro de la asociación
   */
  async updateMiembro(id: string, miembroData: MiembroAsociacionUpdate): Promise<ApiResponse<MiembroAsociacion>> {
    if (!id) {
      return { success: false, error: 'ID del miembro es requerido' }
    }

    // Validar que el miembro existe
    const existingMiembro = await asociacionService.getById(id)
    if (!existingMiembro.success || !existingMiembro.data) {
      return { success: false, error: 'Miembro no encontrado' }
    }

    const namesValidation = personNamesUpdateSchema.safeParse(miembroData)
    if (!namesValidation.success) {
      return { success: false, error: namesValidation.error.issues[0]?.message ?? 'Error de validación de nombres' }
    }

    if (miembroData.email !== undefined) {
      const emailValidation = emailSchema.safeParse(miembroData.email)
      if (!emailValidation.success) {
        return { success: false, error: emailValidation.error.issues[0]?.message ?? 'Error de validación de email' }
      }
    }

    return await asociacionService.update(id, miembroData)
  },

  /**
   * Eliminar un miembro de la asociación (soft delete)
   */
  async deleteMiembro(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'ID del miembro es requerido' }
    }

    // Validar que el miembro existe
    const existingMiembro = await asociacionService.getById(id)
    if (!existingMiembro.success || !existingMiembro.data) {
      return { success: false, error: 'Miembro no encontrado' }
    }

    return await asociacionService.delete(id)
  },

  /**
   * Restaurar un miembro de la asociación
   */
  async restoreMiembro(id: string): Promise<ApiResponse<MiembroAsociacion>> {
    if (!id) {
      return { success: false, error: 'ID del miembro es requerido' }
    }

    return await asociacionService.restore(id)
  }
}


