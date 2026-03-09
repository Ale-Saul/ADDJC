import { clubService } from '@/services/clubService'
import { Club, ClubCreate, ClubUpdate } from '@/models/club'
import { ApiResponse } from '@/types'
import { clubControllerCreateSchema, clubControllerUpdateSchema } from '@/utils/zodSchemas'

export const clubController = {
  /**
   * Obtener todos los clubes
   */
  async getAllClubes(includeInactive: boolean = false): Promise<ApiResponse<Club[]>> {
    return await clubService.getAll(includeInactive)
  },

  /**
   * Obtener un club por ID
   */
  async getClubById(id: string): Promise<ApiResponse<Club>> {
    if (!id) {
      return { success: false, error: 'ID del club es requerido' }
    }

    return await clubService.getById(id)
  },

  /**
   * Crear un nuevo club
   */
  async createClub(clubData: ClubCreate): Promise<ApiResponse<Club>> {
    const validation = clubControllerCreateSchema.safeParse(clubData)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Error de validación' }
    }

    // Por defecto, el club se crea como activo
    const clubToCreate: ClubCreate = {
      ...clubData,
      activo: clubData.activo !== undefined ? clubData.activo : true
    }

    return await clubService.create(clubToCreate)
  },

  /**
   * Actualizar un club
   */
  async updateClub(id: string, clubData: ClubUpdate): Promise<ApiResponse<Club>> {
    if (!id) {
      return { success: false, error: 'ID del club es requerido' }
    }

    // Validar que el club existe
    const existingClub = await clubService.getById(id)
    if (!existingClub.success || !existingClub.data) {
      return { success: false, error: 'Club no encontrado' }
    }

    const validation = clubControllerUpdateSchema.safeParse(clubData)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Error de validación' }
    }

    return await clubService.update(id, clubData)
  },

  /**
   * Eliminar un club (soft delete)
   */
  async deleteClub(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'ID del club es requerido' }
    }

    // Validar que el club existe
    const existingClub = await clubService.getById(id)
    if (!existingClub.success || !existingClub.data) {
      return { success: false, error: 'Club no encontrado' }
    }

    return await clubService.delete(id)
  },

  /**
   * Restaurar un club
   */
  async restoreClub(id: string): Promise<ApiResponse<Club>> {
    if (!id) {
      return { success: false, error: 'ID del club es requerido' }
    }

    return await clubService.restore(id)
  },

  /**
   * Agregar un documento a un club
   */
  async addDocument(clubId: string, nombre: string, url: string, tipo: string, userId: string): Promise<ApiResponse<any>> {
    if (!clubId || !nombre || !url) {
      return { success: false, error: 'Datos incompletos para el documento' }
    }
    return await clubService.addDocument(clubId, nombre, url, tipo, userId)
  },

  /**
   * Eliminar un documento de un club
   */
  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    if (!documentId) {
      return { success: false, error: 'ID del documento es requerido' }
    }
    return await clubService.deleteDocument(documentId)
  }
}

