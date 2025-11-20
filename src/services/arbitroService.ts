import { supabase } from '@/lib/supabase'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { ApiResponse } from '@/types'
import { userService } from './userService'

export const arbitroService = {
  /**
   * Obtener todos los árbitros
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Arbitro[]>> {
    try {
      let query = supabase
        .from('arbitros')
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
   * Obtener un árbitro por ID
   */
  async getById(id: string): Promise<ApiResponse<Arbitro>> {
    try {
      const { data, error } = await supabase
        .from('arbitros')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear un nuevo árbitro
   */
  async create(arbitro: ArbitroCreate): Promise<ApiResponse<Arbitro>> {
    try {
      let userId = arbitro.usuario_id

      // Si no hay usuario_id o es temporal, crear usuario y perfil automáticamente
      if (!userId || userId === 'temp-user-id') {
        const userResult = await userService.createArbitroUser(arbitro.nombres, arbitro.apellidos)
        
        if (!userResult.success || !userResult.data) {
          return { 
            success: false, 
            error: userResult.error || 'Error al crear el usuario del árbitro' 
          }
        }

        userId = userResult.data.userId
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        return { 
          success: false, 
          error: 'Error: El usuario_id debe ser un UUID válido.' 
        }
      }

      // Crear el árbitro con el usuario_id correcto
      const arbitroConUsuario = {
        ...arbitro,
        usuario_id: userId
      }

      const { data, error } = await supabase
        .from('arbitros')
        .insert(arbitroConUsuario)
        .select()
        .single()

      if (error) {
        // Mejorar el mensaje de error
        let errorMessage = error.message
        
        if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
          errorMessage = 'Error: El usuario_id no existe en user_profiles. Por favor, primero crea el usuario y su perfil en el sistema.'
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Error: Ya existe un árbitro con este usuario_id.'
        } else if (error.message.includes('null value') || error.message.includes('not null')) {
          errorMessage = 'Error: Faltan campos requeridos. Por favor, completa todos los campos obligatorios.'
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Error: Los datos no cumplen con las validaciones de la base de datos.'
        }
        
        return { success: false, error: errorMessage }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error al crear árbitro:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el árbitro'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un árbitro
   */
  async update(id: string, arbitro: ArbitroUpdate): Promise<ApiResponse<Arbitro>> {
    try {
      const { data, error } = await supabase
        .from('arbitros')
        .update(arbitro)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un árbitro (soft delete - marca como inactivo)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('arbitros')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Restaurar un árbitro (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Arbitro>> {
    try {
      const { data, error } = await supabase
        .from('arbitros')
        .update({ activo: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}

