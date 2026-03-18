import { createClient } from '@/lib/supabase/client'
import { Pago, PagoCreate, PagoUpdate } from '@/models/pago'
import { ApiResponse } from '@/types'

const PAGO_COLUMNS = 'id, judoka_id, club_id, tipo_pago, concepto, descripcion, monto_base, tiene_descuento, tipo_descuento, descuento_porcentaje, descuento_monto, razon_descuento, monto_final, estado, fecha_vencimiento, fecha_pago, metodo_pago, comprobante_url, notas, observaciones_pago, creador_id, pagador_id, activo, created_at, updated_at'

export const pagoService = {
  /**
   * Obtener todos los pagos
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Pago[]>> {
    try {
      const client = createClient()
      let query = client
        .from('pagos')
        .select(PAGO_COLUMNS)
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
      const client = createClient()
      const { data, error } = await client
        .from('pagos')
        .select(PAGO_COLUMNS)
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
      const client = createClient()
      const { data, error } = await client
        .from('pagos')
        .select(PAGO_COLUMNS)
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
      const client = createClient()
      const { data, error } = await client
        .from('pagos')
        .select(PAGO_COLUMNS)
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
      const client = createClient()
      const { data, error } = await client
        .from('pagos')
        .insert(pago)
        .select(PAGO_COLUMNS)
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
      const client = createClient()
      const { data, error } = await client
        .from('pagos')
        .update(pago)
        .eq('id', id)
        .select(PAGO_COLUMNS)
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
      const client = createClient()
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
      const client = createClient()
      const { data, error } = await client
        .from('pagos')
        .update({ activo: true })
        .eq('id', id)
        .select(PAGO_COLUMNS)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}
