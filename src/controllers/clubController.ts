import { clubService } from '@/services/clubService'
import { Club, ClubCreate, ClubUpdate } from '@/models/club'
import { ApiResponse } from '@/types'

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
    // Validaciones de negocio
    if (!clubData.nombre_club || clubData.nombre_club.trim() === '') {
      return { success: false, error: 'El nombre del club es requerido' }
    }

    if (clubData.nombre_club.length < 3) {
      return { success: false, error: 'El nombre del club debe tener al menos 3 caracteres' }
    }

    if (clubData.nombre_club.length > 200) {
      return { success: false, error: 'El nombre del club no puede exceder 200 caracteres' }
    }

    // Validar teléfono si se proporciona
    if (clubData.telefono_contacto && clubData.telefono_contacto.length > 20) {
      return { success: false, error: 'El teléfono no puede exceder 20 caracteres' }
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

    // Validaciones de negocio
    if (clubData.nombre_club !== undefined) {
      if (clubData.nombre_club.trim() === '') {
        return { success: false, error: 'El nombre del club no puede estar vacío' }
      }

      if (clubData.nombre_club.length < 3) {
        return { success: false, error: 'El nombre del club debe tener al menos 3 caracteres' }
      }

      if (clubData.nombre_club.length > 200) {
        return { success: false, error: 'El nombre del club no puede exceder 200 caracteres' }
      }
    }

    // Validar teléfono si se proporciona
    if (clubData.telefono_contacto && clubData.telefono_contacto.length > 20) {
      return { success: false, error: 'El teléfono no puede exceder 20 caracteres' }
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
  }
}

