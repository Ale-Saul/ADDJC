import { arbitroService } from '@/services/arbitroService'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { ApiResponse } from '@/types'
import { generarPasswordInicial } from '@/utils/passwordUtils'

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

    const paterno = (arbitroData.apellido_paterno ?? '').trim()
    const materno = (arbitroData.apellido_materno ?? '').trim()
    if (!paterno && !materno) {
      return { success: false, error: 'Al menos un apellido (paterno o materno) es requerido' }
    }

    if (arbitroData.nombres.length < 2) {
      return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
    }

    const apellidosCompletos = [paterno, materno].filter(Boolean).join(' ')
    if (apellidosCompletos.length < 2) {
      return { success: false, error: 'Los apellidos deben tener al menos 2 caracteres' }
    }

    if (arbitroData.nombres.length > 100) {
      return { success: false, error: 'El nombre no puede exceder 100 caracteres' }
    }

    if (apellidosCompletos.length > 200) {
      return { success: false, error: 'Los apellidos no pueden exceder 200 caracteres en total' }
    }

    // Generar contraseña automática basada en el carnet
    const autoPassword = generarPasswordInicial(arbitroData.ci || '')

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

    if (arbitroData.apellido_paterno !== undefined || arbitroData.apellido_materno !== undefined) {
      const paterno = (arbitroData.apellido_paterno ?? '').trim()
      const materno = (arbitroData.apellido_materno ?? '').trim()
      if (!paterno && !materno) {
        return { success: false, error: 'Al menos un apellido (paterno o materno) debe estar presente' }
      }
      const apellidosCompletos = [paterno, materno].filter(Boolean).join(' ')
      if (apellidosCompletos.length > 200) {
        return { success: false, error: 'Los apellidos no pueden exceder 200 caracteres en total' }
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

