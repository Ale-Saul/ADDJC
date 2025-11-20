import { supabase } from '@/lib/supabase'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { ApiResponse } from '@/types'
import { userService } from './userService'

export const judokaService = {
  /**
   * Obtener todos los judokas
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Judoka[]>> {
    try {
      let query = supabase
        .from('judokas')
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
   * Obtener judokas por club
   */
  async getByClub(clubId: string): Promise<ApiResponse<Judoka[]>> {
    try {
      const { data, error } = await supabase
        .from('judokas')
        .select('*')
        .eq('club_id', clubId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener judokas por entrenador
   */
  async getByEntrenador(entrenadorId: string): Promise<ApiResponse<Judoka[]>> {
    try {
      const { data, error } = await supabase
        .from('judokas')
        .select('*')
        .eq('entrenador_id', entrenadorId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un judoka por ID
   */
  async getById(id: string): Promise<ApiResponse<Judoka>> {
    try {
      const { data, error } = await supabase
        .from('judokas')
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
   * Crear un nuevo judoka
   */
  async create(judoka: JudokaCreate): Promise<ApiResponse<Judoka>> {
    try {
      let userId = judoka.usuario_id

      // Si no hay usuario_id o es temporal, crear usuario y perfil automáticamente
      if (!userId || userId === 'temp-user-id') {
        const userResult = await userService.createJudokaUser(judoka.nombres, judoka.apellidos)
        
        if (!userResult.success || !userResult.data) {
          return { 
            success: false, 
            error: userResult.error || 'Error al crear el usuario del judoka' 
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

      // Crear el judoka con el usuario_id correcto
      const judokaConUsuario = {
        ...judoka,
        usuario_id: userId
      }

      const { data, error } = await supabase
        .from('judokas')
        .insert(judokaConUsuario)
        .select()
        .single()

      if (error) {
        // Mejorar el mensaje de error
        let errorMessage = error.message
        
        if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
          if (error.message.includes('usuario_id')) {
            errorMessage = 'Error: El usuario_id no existe en user_profiles. Por favor, primero crea el usuario y su perfil en el sistema.'
          } else if (error.message.includes('club_id')) {
            errorMessage = 'Error: El club_id no existe. Por favor, selecciona un club válido.'
          } else if (error.message.includes('entrenador_id')) {
            errorMessage = 'Error: El entrenador_id no existe. Por favor, selecciona un entrenador válido.'
          } else {
            errorMessage = 'Error: Hay un problema con las relaciones de la base de datos.'
          }
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Error: Ya existe un judoka con este usuario_id.'
        } else if (error.message.includes('null value') || error.message.includes('not null')) {
          errorMessage = 'Error: Faltan campos requeridos. Por favor, completa todos los campos obligatorios.'
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Error: Los datos no cumplen con las validaciones de la base de datos.'
        }
        
        return { success: false, error: errorMessage }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error al crear judoka:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el judoka'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un judoka
   */
  async update(id: string, judoka: JudokaUpdate): Promise<ApiResponse<Judoka>> {
    try {
      const { data, error } = await supabase
        .from('judokas')
        .update(judoka)
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
   * Eliminar un judoka (soft delete - marca como inactivo)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('judokas')
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
   * Restaurar un judoka (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Judoka>> {
    try {
      const { data, error } = await supabase
        .from('judokas')
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

