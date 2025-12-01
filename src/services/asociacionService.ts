import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'
import { ApiResponse } from '@/types'

// Helper para obtener el cliente correcto
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

// Función helper para crear usuarios usando Admin API
async function createUserWithAdminAPI(
  email: string,
  password: string,
  nombres: string,
  apellidos: string,
  rol: 'asociacion' | 'sensei' | 'arbitro' | 'judoka' | 'encargado',
  clubId?: string
): Promise<ApiResponse<{ userId: string }>> {
  try {
    const requestBody = {
      email,
      password,
      nombres,
      apellidos,
      rol,
      club_id: clubId,
    }
    
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()
    
    if (!response.ok || !result.success) {
      // Usar el mensaje de error del servidor o un mensaje genérico
      const errorMessage = result.error || `Error al crear usuario (${response.status}: ${response.statusText})`
      
      return {
        success: false,
        error: errorMessage,
      }
    }

    return {
      success: true,
      data: { userId: result.data.userId },
    }
  } catch (error) {
    console.error('Error al crear usuario con Admin API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const asociacionService = {
  /**
   * Obtener todos los miembros de la asociación
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<MiembroAsociacion[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('user_profiles')
        .select('*')
        .eq('rol', 'asociacion')
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error

      // Mapear los datos al formato MiembroAsociacion
      const miembros: MiembroAsociacion[] = (data || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || '',
        nombres: profile.nombres || '',
        apellidos: profile.apellidos || '',
        rol: 'asociacion' as const,
        club_id: profile.club_id || null,
        activo: profile.activo ?? true,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }))

      return { success: true, data: miembros }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un miembro por ID
   */
  async getById(id: string): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .eq('rol', 'asociacion')
        .single()

      if (error) throw error

      const miembro: MiembroAsociacion = {
        id: data.id,
        email: data.email || '',
        nombres: data.nombres || '',
        apellidos: data.apellidos || '',
        rol: 'asociacion' as const,
        club_id: data.club_id || null,
        activo: data.activo ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      return { success: true, data: miembro }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear un nuevo miembro de la asociación
   */
  async create(miembro: MiembroAsociacionCreate): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      // Crear usuario usando Admin API
      const userResult = await createUserWithAdminAPI(
        miembro.email,
        miembro.password,
        miembro.nombres,
        miembro.apellidos,
        'asociacion'
      )

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: userResult.error || 'Error al crear el usuario'
        }
      }

      // Obtener el miembro creado (el perfil se crea automáticamente por el trigger)
      return await this.getById(userResult.data.userId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un miembro de la asociación
   */
  async update(id: string, miembro: MiembroAsociacionUpdate): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const client = getSupabaseClient()
      
      // Preparar los datos a actualizar (excluir password)
      const updateData: any = {}
      if (miembro.nombres !== undefined) updateData.nombres = miembro.nombres
      if (miembro.apellidos !== undefined) updateData.apellidos = miembro.apellidos
      if (miembro.email !== undefined) updateData.email = miembro.email
      if (miembro.activo !== undefined) updateData.activo = miembro.activo

      const { error } = await client
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)
        .eq('rol', 'asociacion')

      if (error) throw error

      // Retornar el miembro actualizado
      return await this.getById(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un miembro de la asociación (soft delete)
   * También elimina el usuario en auth.users para que el email se pueda reutilizar
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      // Marcar como inactivo en user_profiles
      const { error: updateError } = await client
        .from('user_profiles')
        .update({ activo: false })
        .eq('id', id)
        .eq('rol', 'asociacion')

      if (updateError) throw updateError

      // Eliminar el usuario en auth.users para que el email se pueda reutilizar
      try {
        const response = await fetch('/api/admin/disable-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: id,
          }),
        })

        const result = await response.json()
        if (!result.success) {
          console.warn('Error al eliminar usuario en auth.users:', result.error)
          // No fallar la eliminación por esto, solo registrar el warning
        }
      } catch (error) {
        console.warn('Error al llamar API para eliminar usuario:', error)
        // No fallar la eliminación por esto, solo registrar el warning
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Restaurar un miembro de la asociación (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('user_profiles')
        .update({ activo: true })
        .eq('id', id)
        .eq('rol', 'asociacion')

      if (error) throw error

      return await this.getById(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}

