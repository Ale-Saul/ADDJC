import { supabase } from '@/lib/supabase'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { ApiResponse } from '@/types'
import { userService } from './userService'

export const senseiService = {
  /**
   * Obtener todos los senseis
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Sensei[]>> {
    try {
      let query = supabase
        .from('senseis')
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
   * Obtener senseis por club
   */
  async getByClub(clubId: string): Promise<ApiResponse<Sensei[]>> {
    try {
      const { data, error } = await supabase
        .from('senseis')
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
   * Obtener un sensei por ID
   */
  async getById(id: string): Promise<ApiResponse<Sensei>> {
    try {
      const { data, error } = await supabase
        .from('senseis')
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
   * Crear un nuevo sensei
   */
  async create(sensei: SenseiCreate): Promise<ApiResponse<Sensei>> {
    try {
      let userId = sensei.usuario_id

      // Si no hay usuario_id o es temporal, crear usuario y perfil automáticamente
      if (!userId || userId === 'temp-user-id') {
        const userResult = await userService.createSenseiUser(sensei.nombres, sensei.apellidos)
        
        if (!userResult.success || !userResult.data) {
          return { 
            success: false, 
            error: userResult.error || 'Error al crear el usuario del sensei' 
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

      // Crear el sensei con el usuario_id correcto
      const senseiConUsuario = {
        ...sensei,
        usuario_id: userId
      }

      const { data, error } = await supabase
        .from('senseis')
        .insert(senseiConUsuario)
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
          } else {
            errorMessage = 'Error: Hay un problema con las relaciones de la base de datos.'
          }
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Error: Ya existe un sensei con este usuario_id.'
        } else if (error.message.includes('null value') || error.message.includes('not null')) {
          errorMessage = 'Error: Faltan campos requeridos. Por favor, completa todos los campos obligatorios.'
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Error: Los datos no cumplen con las validaciones de la base de datos.'
        }
        
        return { success: false, error: errorMessage }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error al crear sensei:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el sensei'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un sensei
   */
  async update(id: string, sensei: SenseiUpdate): Promise<ApiResponse<Sensei>> {
    try {
      const { data, error } = await supabase
        .from('senseis')
        .update(sensei)
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
   * Eliminar un sensei (soft delete - marca como inactivo)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('senseis')
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
   * Restaurar un sensei (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Sensei>> {
    try {
      const { data, error } = await supabase
        .from('senseis')
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

