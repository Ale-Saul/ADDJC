import { createClient } from '@/lib/supabase/client'
import { 
  AsistenciaSesion, 
  AsistenciaSesionCreate, 
  AsistenciaSesionUpdate,
  AsistenciaDetalle,
  AsistenciaDetalleUpsert
} from '@/models/asistencia'
import { ApiResponse } from '@/types/globales'

const SELECT_SESION_BASE = `
  id, 
  club_id, 
  sensei_id, 
  fecha, 
  hora_inicio, 
  hora_fin, 
  titulo, 
  notas, 
  cerrada_at, 
  activo, 
  created_by, 
  updated_by, 
  created_at, 
  updated_at,
  senseis:sensei_id(
    usuarios:usuario_id(nombre, apellido_paterno, apellido_materno)
  ),
  clubes:club_id(nombre_club)
`

const SELECT_DETALLE_BASE = `
  id,
  sesion_id,
  judoka_id,
  estado,
  observacion,
  marcado_por,
  marcado_at,
  created_at,
  updated_at,
  judokas:judoka_id(
    usuarios:usuario_id(nombre, apellido_paterno, apellido_materno)
  )
`

/**
 * Mapea una fila de la base de datos al modelo AsistenciaSesion
 */
function mapSesionRow(row: any): AsistenciaSesion {
  const s = row.senseis?.usuarios
  const nombreSensei = s 
    ? [s.nombre, s.apellido_paterno, s.apellido_materno].filter(Boolean).join(' ') 
    : undefined
  
  return {
    ...row,
    nombre_sensei: nombreSensei,
    nombre_club: row.clubes?.nombre_club
  }
}

/**
 * Mapea una fila de la base de datos al modelo AsistenciaDetalle
 */
function mapDetalleRow(row: any): AsistenciaDetalle {
  const u = row.judokas?.usuarios
  const nombreJudoka = u?.nombre ?? ''
  const apellidoJudoka = [u?.apellido_paterno, u?.apellido_materno].filter(Boolean).join(' ')

  return {
    ...row,
    nombre_judoka: nombreJudoka,
    apellido_judoka: apellidoJudoka
  }
}

export const asistenciaService = {
  // ... (métodos de sesiones existentes)
  /**
   * Obtiene todas las sesiones activas de un club
   */
  async getByClub(clubId: string): Promise<ApiResponse<AsistenciaSesion[]>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('asistencia_sesiones')
        .select(SELECT_SESION_BASE)
        .eq('club_id', clubId)
        .eq('activo', true)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })

      if (error) throw error
      return { success: true, data: (data || []).map(mapSesionRow) }
    } catch (error) {
      console.error('Error en asistenciaService.getByClub:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al obtener sesiones del club' }
    }
  },

  /**
   * Obtiene todas las sesiones activas de un sensei
   */
  async getBySensei(senseiId: string): Promise<ApiResponse<AsistenciaSesion[]>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('asistencia_sesiones')
        .select(SELECT_SESION_BASE)
        .eq('sensei_id', senseiId)
        .eq('activo', true)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })

      if (error) throw error
      return { success: true, data: (data || []).map(mapSesionRow) }
    } catch (error) {
      console.error('Error en asistenciaService.getBySensei:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al obtener sesiones del sensei' }
    }
  },

  /**
   * Obtiene una sesión por su ID
   */
  async getById(id: string): Promise<ApiResponse<AsistenciaSesion>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('asistencia_sesiones')
        .select(SELECT_SESION_BASE)
        .eq('id', id)
        .single()

      if (error) throw error
      return { success: true, data: mapSesionRow(data) }
    } catch (error) {
      console.error('Error en asistenciaService.getById:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al obtener la sesión' }
    }
  },

  /**
   * Crea una nueva sesión de asistencia
   */
  async create(sesion: AsistenciaSesionCreate): Promise<ApiResponse<AsistenciaSesion>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('asistencia_sesiones')
        .insert({
          club_id: sesion.club_id,
          sensei_id: sesion.sensei_id,
          fecha: sesion.fecha,
          hora_inicio: sesion.hora_inicio || null,
          hora_fin: sesion.hora_fin || null,
          titulo: sesion.titulo || null,
          notas: sesion.notas || null,
          created_by: sesion.created_by || null,
          activo: true
        })
        .select('id')
        .single()

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Ya existe una sesión registrada para este sensei en la misma fecha y hora' }
        }
        throw error
      }

      return await this.getById(data.id)
    } catch (error) {
      console.error('Error en asistenciaService.create:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al crear la sesión' }
    }
  },

  /**
   * Actualiza una sesión existente
   */
  async update(id: string, sesion: AsistenciaSesionUpdate): Promise<ApiResponse<AsistenciaSesion>> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('asistencia_sesiones')
        .update({
          ...sesion,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      return await this.getById(id)
    } catch (error) {
      console.error('Error en asistenciaService.update:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar la sesión' }
    }
  },

  /**
   * Realiza un borrado lógico de la sesión
   */
  async delete(id: string, userId?: string): Promise<ApiResponse<void>> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('asistencia_sesiones')
        .update({ 
          activo: false,
          updated_by: userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error en asistenciaService.delete:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar la sesión' }
    }
  },

  /**
   * Obtiene el detalle de asistencia de una sesión específica
   */
  async getDetalleBySesion(sesionId: string): Promise<ApiResponse<AsistenciaDetalle[]>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('asistencia_detalle')
        .select(SELECT_DETALLE_BASE)
        .eq('sesion_id', sesionId)
        .order('judokas(usuarios(apellido_paterno))', { ascending: true })

      if (error) throw error
      return { success: true, data: (data || []).map(mapDetalleRow) }
    } catch (error) {
      console.error('Error en asistenciaService.getDetalleBySesion:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al obtener el detalle de asistencia' }
    }
  },

  /**
   * Guarda o actualiza la asistencia de varios judokas para una sesión (Upsert masivo)
   */
  async upsertAsistencias(asistencias: AsistenciaDetalleUpsert[]): Promise<ApiResponse<void>> {
    try {
      if (asistencias.length === 0) return { success: true }

      const supabase = createClient()
      const { error } = await supabase
        .from('asistencia_detalle')
        .upsert(
          asistencias.map(a => ({
            sesion_id: a.sesion_id,
            judoka_id: a.judoka_id,
            estado: a.estado,
            observacion: a.observacion || null,
            marcado_por: a.marcado_por || null,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'sesion_id, judoka_id' }
        )

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error en asistenciaService.upsertAsistencias:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al guardar las asistencias' }
    }
  },

  /**
   * Obtiene el historial de asistencia de un judoka específico
   */
  async getHistorialByJudoka(judokaId: string, fechaInicio?: string, fechaFin?: string): Promise<ApiResponse<AsistenciaDetalle[]>> {
    try {
      const supabase = createClient()
      let query = supabase
        .from('asistencia_detalle')
        .select(`
          ${SELECT_DETALLE_BASE},
          asistencia_sesiones!inner(fecha, titulo, activo)
        `)
        .eq('judoka_id', judokaId)
        .eq('asistencia_sesiones.activo', true)

      if (fechaInicio) query = query.gte('asistencia_sesiones.fecha', fechaInicio)
      if (fechaFin) query = query.lte('asistencia_sesiones.fecha', fechaFin)

      const { data, error } = await query.order('asistencia_sesiones(fecha)', { ascending: false })

      if (error) throw error
      return { success: true, data: (data || []).map(mapDetalleRow) }
    } catch (error) {
      console.error('Error en asistenciaService.getHistorialByJudoka:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al obtener el historial del judoka' }
    }
  }
}
