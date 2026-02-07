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
      
      // Crear el club
      const { data, error } = await client
        .from('clubes')
        .insert(club)
        .select()
        .single()

      if (error) throw error

      // Si se asignó un director técnico, actualizar su rol a 'encargado' y club_id
      if (club.director_tecnico_id && data) {
        // Obtener el usuario_id del sensei
        const { data: senseiData } = await client
          .from('senseis')
          .select('usuario_id')
          .eq('id', club.director_tecnico_id)
          .single()

        if (senseiData?.usuario_id) {
          // Actualizar usuarios (rol)
          await client
            .from('usuarios')
            .update({ 
              rol: 'encargado'
            })
            .eq('id', senseiData.usuario_id)
          
          // Actualizar también la tabla senseis para mantener sincronización y asignar club
          await client
            .from('senseis')
            .update({ 
              club_id: data.id
            })
            .eq('id', club.director_tecnico_id)
        }
      }

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
      
      // Si se está actualizando el director técnico, manejar cambios de rol
      if (club.director_tecnico_id !== undefined) {
        // Obtener el director técnico anterior
        const { data: clubAnterior } = await client
          .from('clubes')
          .select('director_tecnico_id')
          .eq('id', id)
          .single()

        const directorAnterior = clubAnterior?.director_tecnico_id
        const directorNuevo = club.director_tecnico_id

        // Si cambió el director técnico
        if (directorAnterior !== directorNuevo) {
          // Si había un director anterior, cambiar su rol a 'sensei'
          if (directorAnterior) {
            // Obtener el usuario_id del sensei anterior
            const { data: senseiAnteriorData } = await client
              .from('senseis')
              .select('usuario_id')
              .eq('id', directorAnterior)
              .single()

            if (senseiAnteriorData?.usuario_id) {
              await client
                .from('usuarios')
                .update({ 
                  rol: 'sensei'
                })
                .eq('id', senseiAnteriorData.usuario_id)
            }
          }

          // Si hay un nuevo director, cambiar su rol a 'encargado' y actualizar club_id
          if (directorNuevo) {
            // Obtener el usuario_id del sensei nuevo
            const { data: senseiNuevoData } = await client
              .from('senseis')
              .select('usuario_id')
              .eq('id', directorNuevo)
              .single()

            if (senseiNuevoData?.usuario_id) {
              // Actualizar usuarios
              await client
                .from('usuarios')
                .update({ 
                  rol: 'encargado'
                })
                .eq('id', senseiNuevoData.usuario_id)
              
              // Actualizar también la tabla senseis para mantener sincronización
              await client
                .from('senseis')
                .update({ 
                  club_id: id
                })
                .eq('id', directorNuevo)
            }
          }
        }
      }

      // Actualizar el club
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
   * Eliminar un club de forma real (hard delete)
   * Esto pondrá en NULL el club_id de los senseis y judokas asociados (por ON DELETE SET NULL)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      const { error } = await client
        .from('clubes')
        .delete()
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

