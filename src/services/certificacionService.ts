import { createClient } from '@/lib/supabase/client'
import { Certificacion, CertificacionCreate, CertificacionUpdate } from '@/models/certificacion'
import { ApiResponse } from '@/types/globales'

export const certificacionService = {
  /**
   * Obtener todas las certificaciones
   */
  async getAll(activo?: boolean): Promise<ApiResponse<Certificacion[]>> {
    try {
      const client = createClient()
      let query = client
        .from('certificaciones')
        .select('id, usuario_id, tipo_afiliado, nombre_certificacion, descripcion, fecha_emision, fecha_vencimiento, archivo_url, activo, created_at, updated_at')
        .order('fecha_emision', { ascending: false })

      if (activo !== undefined) {
        query = query.eq('activo', activo)
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
   * Obtener certificaciones por usuario
   */
  async getByUsuario(usuarioId: string, tipoAfiliado?: 'sensei' | 'arbitro'): Promise<ApiResponse<Certificacion[]>> {
    try {
      const client = createClient()
      let query = client
        .from('certificaciones')
        .select('id, usuario_id, tipo_afiliado, nombre_certificacion, descripcion, fecha_emision, fecha_vencimiento, archivo_url, activo, created_at, updated_at')
        .eq('usuario_id', usuarioId)
        .order('fecha_emision', { ascending: false })

      if (tipoAfiliado) {
        query = query.eq('tipo_afiliado', tipoAfiliado)
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
   * Obtener una certificación por ID
   */
  async getById(id: string): Promise<ApiResponse<Certificacion>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('certificaciones')
        .select('id, usuario_id, tipo_afiliado, nombre_certificacion, descripcion, fecha_emision, fecha_vencimiento, archivo_url, activo, created_at, updated_at')
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
   * Crear una nueva certificación
   */
  async create(certificacion: CertificacionCreate): Promise<ApiResponse<Certificacion>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('certificaciones')
        .insert(certificacion)
        .select('id, usuario_id, tipo_afiliado, nombre_certificacion, descripcion, fecha_emision, fecha_vencimiento, archivo_url, activo, created_at, updated_at')
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar una certificación
   */
  async update(id: string, certificacion: CertificacionUpdate): Promise<ApiResponse<Certificacion>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('certificaciones')
        .update({ ...certificacion, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, usuario_id, tipo_afiliado, nombre_certificacion, descripcion, fecha_emision, fecha_vencimiento, archivo_url, activo, created_at, updated_at')
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar una certificación (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = createClient()
      const { error } = await client
        .from('certificaciones')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar permanentemente una certificación
   */
  async deletePermanent(id: string): Promise<ApiResponse<void>> {
    try {
      const client = createClient()
      const { error } = await client
        .from('certificaciones')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}

