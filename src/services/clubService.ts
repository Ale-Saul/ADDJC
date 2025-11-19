import { supabase } from '@/lib/supabase'
import { Club, ClubCreate, ClubUpdate } from '@/models/club'
import { ApiResponse } from '@/types'

export const clubService = {
  /**
   * Obtener todos los clubes
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Club[]>> {
    try {
      let query = supabase
        .from('clubes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Obtener un club por ID
   */
  async getById(id: string): Promise<ApiResponse<Club>> {
    try {
      const { data, error } = await supabase
        .from('clubes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Crear un nuevo club
   */
  async create(club: ClubCreate): Promise<ApiResponse<Club>> {
    try {
      const { data, error } = await supabase
        .from('clubes')
        .insert(club)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Actualizar un club
   */
  async update(id: string, club: ClubUpdate): Promise<ApiResponse<Club>> {
    try {
      const { data, error } = await supabase
        .from('clubes')
        .update(club)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Eliminar un club (soft delete - marca como inactivo)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { data, error } = await supabase
        .from('clubes')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Restaurar un club (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Club>> {
    try {
      const { data, error } = await supabase
        .from('clubes')
        .update({ activo: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

