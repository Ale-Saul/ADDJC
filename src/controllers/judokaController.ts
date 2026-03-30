import { judokaService } from '@/services/judokaService'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { ApiResponse } from '@/types/globales'
import { generarPasswordInicial } from '@/utils/passwordUtils'
import { personNamesCreateSchema, personNamesUpdateSchema, pesoSchema } from '@/schemas/globales'

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
    const namesValidation = personNamesCreateSchema.safeParse(judokaData)
    if (!namesValidation.success) {
      return { success: false, error: namesValidation.error.issues[0]?.message ?? 'Error de validación' }
    }

    // Validar peso_competitivo
    if (typeof judokaData.peso_competitivo === 'string' && judokaData.peso_competitivo.trim() !== '') {
      const numPeso = parseFloat(judokaData.peso_competitivo)
      if (isNaN(numPeso)) {
        return { success: false, error: 'El peso debe ser un número válido' }
      }
      judokaData.peso_competitivo = numPeso
    } else if (judokaData.peso_competitivo === '') {
      judokaData.peso_competitivo = null
    }

    const pesoValidation = pesoSchema.safeParse(judokaData.peso_competitivo)
    if (!pesoValidation.success) {
      return { success: false, error: pesoValidation.error.issues[0]?.message ?? 'Error de validación' }
    }

    // Generar contraseña automática basada en el carnet
    const autoPassword = generarPasswordInicial(judokaData.ci || '')

    // Por defecto, el judoka se crea como activo
    const judokaToCreate: JudokaCreate = {
      ...judokaData,
      password: autoPassword,
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

    const namesValidation = personNamesUpdateSchema.safeParse(judokaData)
    if (!namesValidation.success) {
      return { success: false, error: namesValidation.error.issues[0]?.message ?? 'Error de validación' }
    }

    if (judokaData.fecha_nacimiento !== undefined && judokaData.fecha_nacimiento !== null && judokaData.fecha_nacimiento.trim() === '') {
      return { success: false, error: 'La fecha de nacimiento no puede estar vacía' }
    }

    // Validar peso_competitivo
    if (typeof judokaData.peso_competitivo === 'string' && judokaData.peso_competitivo.trim() !== '') {
      const numPeso = parseFloat(judokaData.peso_competitivo)
      if (isNaN(numPeso)) {
        return { success: false, error: 'El peso debe ser un número válido' }
      }
      judokaData.peso_competitivo = numPeso
    } else if (judokaData.peso_competitivo === '') {
      judokaData.peso_competitivo = null
    }

    const pesoValidation = pesoSchema.safeParse(judokaData.peso_competitivo)
    if (!pesoValidation.success) {
      return { success: false, error: pesoValidation.error.issues[0]?.message ?? 'Error de validación' }
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

