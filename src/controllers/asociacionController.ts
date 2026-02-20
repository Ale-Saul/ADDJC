import { asociacionService } from '@/services/asociacionService'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'
import { ApiResponse } from '@/types'
import { generarPasswordInicial } from '@/utils/passwordUtils'

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
    // Validaciones de negocio
    if (!miembroData.nombres || miembroData.nombres.trim() === '') {
      return { success: false, error: 'El nombre es requerido' }
    }

    const paterno = (miembroData.apellido_paterno ?? '').trim()
    const materno = (miembroData.apellido_materno ?? '').trim()
    if (!paterno && !materno) {
      return { success: false, error: 'Al menos un apellido (paterno o materno) es requerido' }
    }

    if (!miembroData.email || miembroData.email.trim() === '') {
      return { success: false, error: 'El email es requerido' }
    }

    // Generar contraseña automática basada en el carnet
    const autoPassword = generarPasswordInicial(miembroData.ci || '')

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(miembroData.email)) {
      return { success: false, error: 'El formato del email no es válido' }
    }

    const miembroToCreate: MiembroAsociacionCreate = {
      ...miembroData,
      password: autoPassword
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

    // Validaciones de negocio
    if (miembroData.nombres !== undefined) {
      if (miembroData.nombres.trim() === '') {
        return { success: false, error: 'El nombre no puede estar vacío' }
      }
    }

    if (miembroData.apellido_paterno !== undefined || miembroData.apellido_materno !== undefined) {
      const paterno = (miembroData.apellido_paterno ?? '').trim()
      const materno = (miembroData.apellido_materno ?? '').trim()
      if (!paterno && !materno) {
        return { success: false, error: 'Al menos un apellido (paterno o materno) debe estar presente' }
      }
    }

    if (miembroData.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(miembroData.email)) {
        return { success: false, error: 'El formato del email no es válido' }
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

