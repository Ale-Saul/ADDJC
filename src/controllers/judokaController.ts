import { judokaService } from '@/services/judokaService'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { ApiResponse } from '@/types'

export const judokaController = {
  /**
   * Obtener todos los judokas
   */
  async getAllJudokas(includeInactive: boolean = false): Promise<ApiResponse<Judoka[]>> {
    return await judokaService.getAll(includeInactive)
  },

  /**
   * Obtener judokas por club
   */
  async getJudokasByClub(clubId: string): Promise<ApiResponse<Judoka[]>> {
    if (!clubId) {
      return { success: false, error: 'ID del club es requerido' }
    }

    return await judokaService.getByClub(clubId)
  },

  /**
   * Obtener judokas por entrenador
   */
  async getJudokasByEntrenador(entrenadorId: string): Promise<ApiResponse<Judoka[]>> {
    if (!entrenadorId) {
      return { success: false, error: 'ID del entrenador es requerido' }
    }

    return await judokaService.getByEntrenador(entrenadorId)
  },

  /**
   * Obtener un judoka por ID
   */
  async getJudokaById(id: string): Promise<ApiResponse<Judoka>> {
    if (!id) {
      return { success: false, error: 'ID del judoka es requerido' }
    }

    return await judokaService.getById(id)
  },

  /**
   * Crear un nuevo judoka
   */
  async createJudoka(judokaData: JudokaCreate): Promise<ApiResponse<Judoka>> {
    // Validaciones de negocio
    if (!judokaData.nombres || judokaData.nombres.trim() === '') {
      return { success: false, error: 'El nombre es requerido' }
    }

    const paterno = (judokaData.apellido_paterno ?? '').trim()
    const materno = (judokaData.apellido_materno ?? '').trim()
    if (!paterno && !materno) {
      return { success: false, error: 'Al menos un apellido (paterno o materno) es requerido' }
    }

    if (!judokaData.fecha_nacimiento || judokaData.fecha_nacimiento.trim() === '') {
      return { success: false, error: 'La fecha de nacimiento es requerida' }
    }

    if (judokaData.nombres.length < 2) {
      return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
    }

    const apellidosCompletos = [paterno, materno].filter(Boolean).join(' ')
    if (apellidosCompletos.length < 2) {
      return { success: false, error: 'Los apellidos deben tener al menos 2 caracteres' }
    }

    if (judokaData.nombres.length > 100) {
      return { success: false, error: 'El nombre no puede exceder 100 caracteres' }
    }

    if (apellidosCompletos.length > 200) {
      return { success: false, error: 'Los apellidos no pueden exceder 200 caracteres en total' }
    }

    // Validar peso si se proporciona
    if (judokaData.peso_competitivo !== null && judokaData.peso_competitivo !== undefined) {
      if (judokaData.peso_competitivo < 0) {
        return { success: false, error: 'El peso no puede ser negativo' }
      }
      if (judokaData.peso_competitivo > 300) {
        return { success: false, error: 'El peso no puede exceder 300 kg' }
      }
    }

    // Por defecto, el judoka se crea como activo
    const judokaToCreate: JudokaCreate = {
      ...judokaData,
      activo: judokaData.activo !== undefined ? judokaData.activo : true
    }

    return await judokaService.create(judokaToCreate)
  },

  /**
   * Actualizar un judoka
   */
  async updateJudoka(id: string, judokaData: JudokaUpdate): Promise<ApiResponse<Judoka>> {
    if (!id) {
      return { success: false, error: 'ID del judoka es requerido' }
    }

    // Validar que el judoka existe
    const existingJudoka = await judokaService.getById(id)
    if (!existingJudoka.success || !existingJudoka.data) {
      return { success: false, error: 'Judoka no encontrado' }
    }

    // Validaciones de negocio
    if (judokaData.nombres !== undefined) {
      if (judokaData.nombres.trim() === '') {
        return { success: false, error: 'El nombre no puede estar vacío' }
      }

      if (judokaData.nombres.length < 2) {
        return { success: false, error: 'El nombre debe tener al menos 2 caracteres' }
      }

      if (judokaData.nombres.length > 100) {
        return { success: false, error: 'El nombre no puede exceder 100 caracteres' }
      }
    }

    if (judokaData.apellido_paterno !== undefined || judokaData.apellido_materno !== undefined) {
      const paterno = (judokaData.apellido_paterno ?? '').trim()
      const materno = (judokaData.apellido_materno ?? '').trim()
      if (!paterno && !materno) {
        return { success: false, error: 'Al menos un apellido (paterno o materno) debe estar presente' }
      }
      const apellidosCompletos = [paterno, materno].filter(Boolean).join(' ')
      if (apellidosCompletos.length > 200) {
        return { success: false, error: 'Los apellidos no pueden exceder 200 caracteres en total' }
      }
    }

    if (judokaData.fecha_nacimiento !== undefined && judokaData.fecha_nacimiento !== null) {
      if (judokaData.fecha_nacimiento.trim() === '') {
        return { success: false, error: 'La fecha de nacimiento no puede estar vacía' }
      }
    }

    // Validar peso si se proporciona
    if (judokaData.peso_competitivo !== null && judokaData.peso_competitivo !== undefined) {
      if (judokaData.peso_competitivo < 0) {
        return { success: false, error: 'El peso no puede ser negativo' }
      }
      if (judokaData.peso_competitivo > 300) {
        return { success: false, error: 'El peso no puede exceder 300 kg' }
      }
    }

    return await judokaService.update(id, judokaData)
  },

  /**
   * Eliminar un judoka (soft delete)
   */
  async deleteJudoka(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'ID del judoka es requerido' }
    }

    // Validar que el judoka existe
    const existingJudoka = await judokaService.getById(id)
    if (!existingJudoka.success || !existingJudoka.data) {
      return { success: false, error: 'Judoka no encontrado' }
    }

    return await judokaService.delete(id)
  },

  /**
   * Restaurar un judoka
   */
  async restoreJudoka(id: string): Promise<ApiResponse<Judoka>> {
    if (!id) {
      return { success: false, error: 'ID del judoka es requerido' }
    }

    return await judokaService.restore(id)
  }
}

