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
  apellido_paterno: string,
  apellido_materno: string,
  rol: 'admin' | 'asociacion' | 'sensei' | 'arbitro' | 'judoka' | 'encargado',
  clubId?: string
): Promise<ApiResponse<{ userId: string }>> {
  try {
    const requestBody = {
      email,
      password,
      nombres,
      apellido_paterno,
      apellido_materno,
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
   * Obtener todos los miembros de la asociación (desde tabla usuarios)
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<MiembroAsociacion[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('usuarios')
        .select('*, asociacion(cargo)')
        .eq('rol', 'asociacion')
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error

      type UsuarioRow = { id: string; correo?: string; nombre?: string; apellido_paterno?: string; apellido_materno?: string; club_id?: string | null; activo?: boolean; created_at: string; updated_at: string; asociacion?: { cargo?: string }[] | { cargo?: string } }
      const miembros: MiembroAsociacion[] = (data || []).map((u: UsuarioRow) => {
        const cargo = Array.isArray(u.asociacion) ? u.asociacion[0]?.cargo : (u.asociacion as { cargo?: string })?.cargo
        return {
          id: u.id,
          email: u.correo || '',
          nombres: u.nombre || '',
          apellidos: [u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ') || '',
          apellido_paterno: u.apellido_paterno || '',
          apellido_materno: u.apellido_materno || '',
          rol: 'asociacion' as const,
          club_id: u.club_id || null,
          activo: u.activo ?? true,
          created_at: u.created_at,
          updated_at: u.updated_at,
          cargo: cargo ?? null,
        }
      })

      return { success: true, data: miembros }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un miembro por ID (desde tabla usuarios)
   */
  async getById(id: string): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('usuarios')
        .select('*, asociacion(cargo)')
        .eq('id', id)
        .eq('rol', 'asociacion')
        .single()

      if (error) throw error

      const cargo = Array.isArray(data.asociacion) ? data.asociacion[0]?.cargo : (data.asociacion as { cargo?: string })?.cargo
      const miembro: MiembroAsociacion = {
        id: data.id,
        email: data.correo || '',
        nombres: data.nombre || '',
        apellidos: [data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' ') || '',
        apellido_paterno: data.apellido_paterno || '',
        apellido_materno: data.apellido_materno || '',
        rol: 'asociacion' as const,
        club_id: data.club_id || null,
        activo: data.activo ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
        cargo: cargo ?? null,
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
      const userResult = await createUserWithAdminAPI(
        miembro.email,
        miembro.password!,
        miembro.nombres,
        miembro.apellido_paterno,
        miembro.apellido_materno,
        'asociacion'
      )

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: userResult.error || 'Error al crear el usuario'
        }
      }

      const client = getSupabaseClient()
      const { data: usuario, error: findError } = await client
        .from('usuarios')
        .select('id')
        .eq('auth_user_id', userResult.data.userId)
        .eq('rol', 'asociacion')
        .single()
      if (findError || !usuario) {
        return { success: false, error: 'Usuario creado pero no se encontró en la base de datos.' }
      }

      // Insertar en tabla asociacion con cargo
      const { error: insertAsocError } = await client
        .from('asociacion')
        .insert({ usuario_id: usuario.id, cargo: miembro.cargo || null })
      if (insertAsocError) {
        console.warn('Error al crear fila en asociacion:', insertAsocError)
      }

      return await this.getById(usuario.id)
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
      const updateData: { nombre?: string; apellido_paterno?: string; apellido_materno?: string; correo?: string; activo?: boolean } = {}
      if (miembro.nombres !== undefined) updateData.nombre = miembro.nombres
      if (miembro.apellido_paterno !== undefined) updateData.apellido_paterno = miembro.apellido_paterno
      if (miembro.apellido_materno !== undefined) updateData.apellido_materno = miembro.apellido_materno
      if (miembro.email !== undefined) updateData.correo = miembro.email
      if (miembro.activo !== undefined) updateData.activo = miembro.activo

      if (Object.keys(updateData).length > 0) {
        const { error } = await client
          .from('usuarios')
          .update(updateData)
          .eq('id', id)
          .eq('rol', 'asociacion')
        if (error) throw error
      }

      if (miembro.cargo !== undefined) {
        const { data: asoc } = await client.from('asociacion').select('id').eq('usuario_id', id).single()
        if (asoc) {
          await client.from('asociacion').update({ cargo: miembro.cargo }).eq('usuario_id', id)
        } else {
          await client.from('asociacion').insert({ usuario_id: id, cargo: miembro.cargo })
        }
      }

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

      const { data: usuario, error: getError } = await client
        .from('usuarios')
        .select('auth_user_id')
        .eq('id', id)
        .eq('rol', 'asociacion')
        .single()

      if (getError || !usuario?.auth_user_id) {
        return { success: false, error: 'Miembro no encontrado' }
      }

      const { error: updateError } = await client
        .from('usuarios')
        .update({ activo: false })
        .eq('id', id)
        .eq('rol', 'asociacion')

      if (updateError) throw updateError

      try {
        const response = await fetch('/api/admin/disable-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: usuario.auth_user_id,
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
        .from('usuarios')
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

