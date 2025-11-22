import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { Club, ClubCreate, ClubUpdate } from '@/models/club'
import { ApiResponse } from '@/types'

// Helper para obtener el cliente correcto (navegador si está disponible, básico si no)
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

export const clubService = {
  /**
   * Obtener todos los clubes
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Club[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('clubes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un club por ID
   */
  async getById(id: string): Promise<ApiResponse<Club>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
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
      const client = getSupabaseClient()
      const { data, error } = await client
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
      const client = getSupabaseClient()
      const { data, error } = await client
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
   * También limpia las referencias en otras tablas (senseis, judokas, user_profiles)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      // Marcar el club como inactivo
      const { error: updateError } = await client
        .from('clubes')
        .update({ activo: false })
        .eq('id', id)

      if (updateError) throw updateError

      // Limpiar referencias en otras tablas
      // 1. Limpiar club_id en senseis
      const { error: senseisError } = await client
        .from('senseis')
        .update({ club_id: null })
        .eq('club_id', id)

      if (senseisError) {
        console.warn('Error al limpiar referencias en senseis:', senseisError)
      }

      // 2. Limpiar club_id en judokas
      const { error: judokasError } = await client
        .from('judokas')
        .update({ club_id: null })
        .eq('club_id', id)

      if (judokasError) {
        console.warn('Error al limpiar referencias en judokas:', judokasError)
      }

      // 3. Limpiar club_id en user_profiles
      const { error: profilesError } = await client
        .from('user_profiles')
        .update({ club_id: null })
        .eq('club_id', id)

      if (profilesError) {
        console.warn('Error al limpiar referencias en user_profiles:', profilesError)
      }

      // Nota: No necesitamos limpiar director_tecnico_id porque este campo referencia a user_profiles.id,
      // no a clubes.id. Si un sensei (director técnico) es eliminado, esa referencia se limpia en senseiService.delete()

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
      const client = getSupabaseClient()
      const { data, error } = await client
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

