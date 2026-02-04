import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { Pago, PagoCreate, PagoUpdate } from '@/models/pago'
import { ApiResponse } from '@/types'

// Helper para obtener el cliente correcto (navegador si está disponible, básico si no)
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

export const pagoService = {
  /**
   * Obtener todos los pagos
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Pago[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('pagos')
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
   * Obtener pagos por judoka
   */
  async getByJudoka(judokaId: string): Promise<ApiResponse<Pago[]>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('pagos')
        .select('*')
        .eq('judoka_id', judokaId)
        .eq('activo', true)
        .order('fecha_vencimiento', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener pagos por club
   */
  async getByClub(clubId: string): Promise<ApiResponse<Pago[]>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('pagos')
        .select('*')
        .eq('club_id', clubId)
        .eq('activo', true)
        .order('fecha_vencimiento', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un pago por ID
   */
  async getById(id: string): Promise<ApiResponse<Pago>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('pagos')
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
   * Crear un nuevo pago
   */
  async create(pago: PagoCreate): Promise<ApiResponse<Pago>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('pagos')
        .insert(pago)
        .select()
        .single()

      if (error) {
        let errorMessage = error.message
        
        if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
          if (error.message.includes('judoka_id')) {
            errorMessage = 'Error: El judoka no existe. Por favor, selecciona un judoka válido.'
          } else if (error.message.includes('club_id')) {
            errorMessage = 'Error: El club no existe. Por favor, selecciona un club válido.'
          } else if (error.message.includes('creador_id')) {
            errorMessage = 'Error: El usuario creador no existe.'
          }
        } else if (error.message.includes('check constraint')) {
          errorMessage = 'Error: Los datos no cumplen con las validaciones. Verifica los montos y descuentos.'
        }
        
        return { success: false, error: errorMessage }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error al crear pago:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el pago'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un pago
   */
  async update(id: string, pago: PagoUpdate): Promise<ApiResponse<Pago>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('pagos')
        .update(pago)
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
   * Eliminar un pago (soft delete - marca como inactivo)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('pagos')
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
   * Restaurar un pago (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Pago>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('pagos')
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
