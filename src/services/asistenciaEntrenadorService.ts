import { createClient } from '@/lib/supabase/client'
import {
  AsistenciaEntrenador,
  MarcarEntradaDTO,
  MarcarSalidaDTO,
} from '@/models/asistenciaEntrenador'
import { ApiResponse } from '@/types/globales'

const SELECT_BASE = `
  id,
  club_id,
  entrenador_id,
  tipo_evento,
  categoria,
  titulo,
  fecha,
  hora_entrada,
  latitud_entrada,
  longitud_entrada,
  precision_entrada,
  ubicacion_texto_entrada,
  hora_salida,
  latitud_salida,
  longitud_salida,
  precision_salida,
  ubicacion_texto_salida,
  estado,
  notas,
  created_at,
  updated_at,
  senseis:entrenador_id(
    usuarios:usuario_id(nombre, apellido_paterno, apellido_materno)
  ),
  clubes:club_id(nombre_club)
`

function mapRow(row: any): AsistenciaEntrenador {
  const u = row.senseis?.usuarios
  const nombreEntrenador = u?.nombre || ''
  const apellidoEntrenador = [u?.apellido_paterno, u?.apellido_materno].filter(Boolean).join(' ')

  return {
    ...row,
    nombre_entrenador: nombreEntrenador,
    apellido_entrenador: apellidoEntrenador,
    nombre_club: row.clubes?.nombre_club,
  }
}

export const asistenciaEntrenadorService = {
  /**
   * Obtiene la sesión activa (en curso) de un entrenador, si existe.
   */
  async getActivaByEntrenador(entrenadorId: string): Promise<ApiResponse<AsistenciaEntrenador | null>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('asistencia_entrenadores')
        .select(SELECT_BASE)
        .eq('entrenador_id', entrenadorId)
        .eq('estado', 'en_curso')
        .order('hora_entrada', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return { success: true, data: data ? mapRow(data) : null }
    } catch (error) {
      console.error('Error en getActivaByEntrenador:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al consultar marcación activa' }
    }
  },

  /**
   * Registra la entrada (check-in con GPS) del entrenador al iniciar entrenamiento o partido.
   */
  async marcarEntrada(dto: MarcarEntradaDTO): Promise<ApiResponse<AsistenciaEntrenador>> {
    try {
      const supabase = createClient()

      // Verificar si ya tiene una activa
      const activaRes = await this.getActivaByEntrenador(dto.entrenador_id)
      if (activaRes.success && activaRes.data) {
        return {
          success: false,
          error: `Ya tienes un ${activaRes.data.tipo_evento} en curso iniciado a las ${new Date(activaRes.data.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Debes marcar salida antes de iniciar otro.`,
        }
      }

      const { data, error } = await supabase
        .from('asistencia_entrenadores')
        .insert({
          club_id: dto.club_id,
          entrenador_id: dto.entrenador_id,
          tipo_evento: dto.tipo_evento,
          categoria: dto.categoria || null,
          titulo: dto.titulo || null,
          hora_entrada: new Date().toISOString(),
          latitud_entrada: dto.latitud ?? null,
          longitud_entrada: dto.longitud ?? null,
          precision_entrada: dto.precision ?? null,
          ubicacion_texto_entrada: dto.ubicacion_texto || null,
          estado: 'en_curso',
          notas: dto.notas || null,
        })
        .select(SELECT_BASE)
        .single()

      if (error) throw error
      return { success: true, data: mapRow(data) }
    } catch (error) {
      console.error('Error en marcarEntrada:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al registrar entrada' }
    }
  },

  /**
   * Registra la salida (check-out con GPS) del entrenador al finalizar.
   */
  async marcarSalida(dto: MarcarSalidaDTO): Promise<ApiResponse<AsistenciaEntrenador>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('asistencia_entrenadores')
        .update({
          hora_salida: new Date().toISOString(),
          latitud_salida: dto.latitud ?? null,
          longitud_salida: dto.longitud ?? null,
          precision_salida: dto.precision ?? null,
          ubicacion_texto_salida: dto.ubicacion_texto || null,
          estado: 'completado',
          notas: dto.notas || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.id)
        .select(SELECT_BASE)
        .single()

      if (error) throw error
      return { success: true, data: mapRow(data) }
    } catch (error) {
      console.error('Error en marcarSalida:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al registrar salida' }
    }
  },

  /**
   * Lista el historial de asistencias de entrenadores con filtros opcionales.
   */
  async getHistorial(filters: {
    clubId?: string
    entrenadorId?: string
    fechaInicio?: string
    fechaFin?: string
    tipoEvento?: string
    categoria?: string
  }): Promise<ApiResponse<AsistenciaEntrenador[]>> {
    try {
      const supabase = createClient()
      let query = supabase
        .from('asistencia_entrenadores')
        .select(SELECT_BASE)
        .order('hora_entrada', { ascending: false })

      if (filters.clubId) {
        query = query.eq('club_id', filters.clubId)
      }
      if (filters.entrenadorId) {
        query = query.eq('entrenador_id', filters.entrenadorId)
      }
      if (filters.fechaInicio) {
        query = query.gte('fecha', filters.fechaInicio)
      }
      if (filters.fechaFin) {
        query = query.lte('fecha', filters.fechaFin)
      }
      if (filters.tipoEvento && filters.tipoEvento !== 'all') {
        query = query.eq('tipo_evento', filters.tipoEvento)
      }
      if (filters.categoria && filters.categoria !== 'all') {
        query = query.eq('categoria', filters.categoria)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data: (data || []).map(mapRow) }
    } catch (error) {
      console.error('Error en getHistorial:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Error al consultar historial' }
    }
  },
}

