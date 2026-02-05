import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { ApiResponse } from '@/types'
import { userService } from './userService'

// Helper para obtener el cliente correcto (navegador si está disponible, básico si no)
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

export const arbitroService = {
  /**
   * Obtener todos los árbitros
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Arbitro[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('arbitros')
        .select('*, certificacion:certificaciones(nombre_certificacion)')
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error

      const mapped = (data || []).map((row: any) => ({
        ...row,
        certificacion: row.certificacion?.nombre_certificacion ?? null,
        certificacion_id: row.certificacion_id ?? null,
      }))
      return { success: true, data: mapped }
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
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('arbitros')
        .select('*, certificacion:certificaciones(nombre_certificacion)')
        .eq('id', id)
        .single()

      if (error) throw error

      const mapped = {
        ...data,
        certificacion: data?.certificacion?.nombre_certificacion ?? null,
        certificacion_id: data?.certificacion_id ?? null,
      }
      return { success: true, data: mapped }
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
        // Validar que se proporcionen email y password
        if (!arbitro.email || !arbitro.password) {
          return {
            success: false,
            error: 'Email y contraseña son requeridos para crear un nuevo árbitro'
          }
        }

        const userResult = await userService.createArbitroUser(
          arbitro.nombres, 
          arbitro.apellidos, 
          arbitro.email, 
          arbitro.password
        )
        
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

      const { email, password, certificacion, ...arbitroData } = arbitro as ArbitroCreate & { certificacion?: string | null }
      const arbitroConUsuario = {
        ...arbitroData,
        usuario_id: userId,
        certificacion_id: arbitro.certificacion_id ?? null,
      }

      const client = getSupabaseClient()
      const { data, error } = await client
        .from('arbitros')
        .insert(arbitroConUsuario)
        .select('*, certificacion:certificaciones(nombre_certificacion)')
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

      const mapped = data ? {
        ...data,
        certificacion: data.certificacion?.nombre_certificacion ?? null,
        certificacion_id: data.certificacion_id ?? null,
      } : data
      return { success: true, data: mapped }
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
      const client = getSupabaseClient()
      const { certificacion, ...updatePayload } = arbitro as ArbitroUpdate & { certificacion?: string | null }
      const { data, error } = await client
        .from('arbitros')
        .update(updatePayload)
        .eq('id', id)
        .select('*, certificacion:certificaciones(nombre_certificacion)')
        .single()

      if (error) throw error

      const mapped = {
        ...data,
        certificacion: data?.certificacion?.nombre_certificacion ?? null,
        certificacion_id: data?.certificacion_id ?? null,
      }
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un árbitro (soft delete - marca como inactivo)
   * También elimina el usuario en auth.users para que el email se pueda reutilizar
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      // Primero obtener el árbitro para conocer su usuario_id
      const { data: arbitro, error: getError } = await client
        .from('arbitros')
        .select('id, usuario_id')
        .eq('id', id)
        .single()

      if (getError) throw getError
      if (!arbitro) {
        return { success: false, error: 'Árbitro no encontrado' }
      }

      // Marcar el árbitro como inactivo
      const { error: updateError } = await client
        .from('arbitros')
        .update({ activo: false })
        .eq('id', id)

      if (updateError) throw updateError

      // Deshabilitar/eliminar el usuario en auth.users para que el email se pueda reutilizar
      if (arbitro.usuario_id) {
        try {
          const response = await fetch('/api/admin/disable-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: arbitro.usuario_id,
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
   * Restaurar un árbitro (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Arbitro>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
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

