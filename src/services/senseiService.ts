import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { ApiResponse } from '@/types'
import { userService } from './userService'

// Helper para obtener el cliente correcto (navegador si está disponible, básico si no)
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

export const senseiService = {
  /**
   * Obtener todos los senseis
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Sensei[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
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
      const client = getSupabaseClient()
      const { data, error } = await client
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
      const client = getSupabaseClient()
      const { data, error } = await client
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
        // Validar que se proporcionen email y password
        if (!sensei.email || !sensei.password) {
          return {
            success: false,
            error: 'Email y contraseña son requeridos para crear un nuevo sensei'
          }
        }

        // Determinar qué función usar según si es encargado o sensei normal
        const userResult = sensei.isEncargado
          ? await userService.createEncargadoUser(
              sensei.nombres, 
              sensei.apellidos, 
              sensei.email, 
              sensei.password,
              sensei.club_id || undefined
            )
          : await userService.createSenseiUser(
              sensei.nombres, 
              sensei.apellidos, 
              sensei.email, 
              sensei.password
            )
        
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
      // Excluir email, password e isEncargado ya que no existen en la tabla senseis
      const { email, password, isEncargado, ...senseiData } = sensei
      const senseiConUsuario = {
        ...senseiData,
        usuario_id: userId
      }

      const client = getSupabaseClient()
      const { data, error } = await client
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

      // Actualizar club_id en user_profiles si el sensei tiene un club asignado
      if (data && data.club_id) {
        await client
          .from('user_profiles')
          .update({ club_id: data.club_id, updated_at: new Date().toISOString() })
          .eq('id', userId)
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
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('senseis')
        .update(sensei)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Si se actualizó el club_id del sensei, actualizar también en user_profiles
      if (data && sensei.club_id !== undefined) {
        await client
          .from('user_profiles')
          .update({ club_id: sensei.club_id, updated_at: new Date().toISOString() })
          .eq('id', data.usuario_id)
      }

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un sensei (soft delete - marca como inactivo)
   * También limpia las referencias en otras tablas (clubes, judokas)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      // Primero obtener el sensei para conocer su usuario_id
      const { data: sensei, error: getError } = await client
        .from('senseis')
        .select('id, usuario_id')
        .eq('id', id)
        .single()

      if (getError) throw getError
      if (!sensei) {
        return { success: false, error: 'Sensei no encontrado' }
      }

      // Actualizar el sensei como inactivo
      const { error: updateError } = await client
        .from('senseis')
        .update({ activo: false })
        .eq('id', id)

      if (updateError) throw updateError

      // Limpiar referencias en otras tablas
      // 1. Limpiar director_tecnico_id en clubes (referencia al usuario_id)
      if (sensei.usuario_id) {
        const { error: clubesError } = await client
          .from('clubes')
          .update({ director_tecnico_id: null })
          .eq('director_tecnico_id', sensei.usuario_id)

        if (clubesError) {
          console.warn('Error al limpiar referencias en clubes:', clubesError)
          // No fallar la eliminación por esto, solo registrar el warning
        }
      }

      // 2. Limpiar entrenador_id en judokas (referencia al id del sensei)
      const { error: judokasError } = await client
        .from('judokas')
        .update({ entrenador_id: null })
        .eq('entrenador_id', id)

      if (judokasError) {
        console.warn('Error al limpiar referencias en judokas:', judokasError)
        // No fallar la eliminación por esto, solo registrar el warning
      }

      // 3. Deshabilitar/eliminar el usuario en auth.users para que el email se pueda reutilizar
      if (sensei.usuario_id) {
        try {
          const response = await fetch('/api/admin/disable-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: sensei.usuario_id,
            }),
          })

          const result = await response.json()
          if (!result.success) {
            console.warn('Error al deshabilitar usuario en auth.users:', result.error)
            // No fallar la eliminación por esto, solo registrar el warning
          }
        } catch (error) {
          console.warn('Error al llamar API para deshabilitar usuario:', error)
          // No fallar la eliminación por esto, solo registrar el warning
        }
      }

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
      const client = getSupabaseClient()
      const { data, error } = await client
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

