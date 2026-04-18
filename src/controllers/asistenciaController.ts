import { asistenciaService } from '@/services/asistenciaService'
import { 
  AsistenciaSesion, 
  AsistenciaSesionCreate, 
  AsistenciaSesionUpdate,
  AsistenciaDetalle,
  AsistenciaDetalleUpsert
} from '@/models/asistencia'
import { 
  createSesionSchema, 
  updateSesionSchema, 
  asistenciaMasivaSchema,
  filtroAsistenciaSchema
} from '@/schemas/asistenciaSchema'
import { ApiResponse } from '@/types/globales'

export const asistenciaController = {
  /**
   * Obtener sesiones por club (para encargados)
   */
  async getSesionesByClub(clubId: string): Promise<ApiResponse<AsistenciaSesion[]>> {
    if (!clubId) {
      return { success: false, error: 'El ID del club es requerido' }
    }
    return await asistenciaService.getByClub(clubId)
  },

  /**
   * Obtener sesiones por sensei (para su propia vista)
   */
  async getSesionesBySensei(senseiId: string): Promise<ApiResponse<AsistenciaSesion[]>> {
    if (!senseiId) {
      return { success: false, error: 'El ID del sensei es requerido' }
    }
    return await asistenciaService.getBySensei(senseiId)
  },

  /**
   * Obtener detalle de una sesión
   */
  async getSesionById(id: string): Promise<ApiResponse<AsistenciaSesion>> {
    if (!id) {
      return { success: false, error: 'El ID de la sesión es requerido' }
    }
    return await asistenciaService.getById(id)
  },

  /**
   * Crear una nueva sesión de asistencia
   */
  async createSesion(data: AsistenciaSesionCreate): Promise<ApiResponse<AsistenciaSesion>> {
    const validation = createSesionSchema.safeParse(data)
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.issues[0]?.message ?? 'Datos de sesión inválidos' 
      }
    }

    return await asistenciaService.create(data)
  },

  /**
   * Actualizar metadatos de una sesión
   */
  async updateSesion(id: string, data: AsistenciaSesionUpdate): Promise<ApiResponse<AsistenciaSesion>> {
    if (!id) {
      return { success: false, error: 'El ID de la sesión es requerido' }
    }

    const validation = updateSesionSchema.safeParse(data)
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.issues[0]?.message ?? 'Datos de actualización inválidos' 
      }
    }

    return await asistenciaService.update(id, data)
  },

  /**
   * Eliminar (borrado lógico) una sesión
   */
  async deleteSesion(id: string, userId?: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'El ID de la sesión es requerido' }
    }
    return await asistenciaService.delete(id, userId)
  },

  /**
   * Obtener la lista de asistencia de una sesión
   */
  async getAsistenciasBySesion(sesionId: string): Promise<ApiResponse<AsistenciaDetalle[]>> {
    if (!sesionId) {
      return { success: false, error: 'El ID de la sesión es requerido' }
    }
    return await asistenciaService.getDetalleBySesion(sesionId)
  },

  /**
   * Guardar asistencia masiva (tomar lista)
   */
  async registrarAsistenciaMasiva(sesionId: string, asistencias: AsistenciaDetalleUpsert[]): Promise<ApiResponse<void>> {
    if (!sesionId) {
      return { success: false, error: 'El ID de la sesión es requerido' }
    }

    const validation = asistenciaMasivaSchema.safeParse({ sesion_id: sesionId, asistencias })
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.issues[0]?.message ?? 'Datos de asistencia inválidos' 
      }
    }

    return await asistenciaService.upsertAsistencias(asistencias)
  },

  /**
   * Obtener historial de un judoka (para Asociación o Judoka)
   */
  async getHistorialJudoka(judokaId: string, filtros?: { fecha_inicio?: string, fecha_fin?: string }): Promise<ApiResponse<AsistenciaDetalle[]>> {
    if (!judokaId) {
      return { success: false, error: 'El ID del judoka es requerido' }
    }

    if (filtros) {
      const validation = filtroAsistenciaSchema.safeParse({ judoka_id: judokaId, ...filtros })
      if (!validation.success) {
        return { 
          success: false, 
          error: validation.error.issues[0]?.message ?? 'Filtros inválidos' 
        }
      }
    }

    return await asistenciaService.getHistorialByJudoka(judokaId, filtros?.fecha_inicio, filtros?.fecha_fin)
  },

  /**
   * Obtener estadísticas de asistencia de un judoka (para su propia vista o Asociación)
   */
  async getStatsJudoka(judokaId: string, filtros?: { fecha_inicio?: string, fecha_fin?: string }): Promise<ApiResponse<AsistenciaStatsJudoka>> {
    const historialRes = await this.getHistorialJudoka(judokaId, filtros)
    if (!historialRes.success || !historialRes.data) {
      return { success: false, error: historialRes.error || 'Error al obtener historial para estadísticas' }
    }

    const total = historialRes.data.length
    const presentes = historialRes.data.filter(d => d.estado === 'presente').length
    const ausentes = total - presentes
    const porcentaje = total > 0 ? (presentes / total) * 100 : 0

    return {
      success: true,
      data: {
        judoka_id: judokaId,
        total_sesiones: total,
        presentes,
        ausentes,
        porcentaje: Number(porcentaje.toFixed(2))
      }
    }
  },

  /**
   * Obtener estadísticas de todos los estudiantes de un sensei
   */
  async getStatsBySensei(senseiId: string, filtros?: { fecha_inicio?: string, fecha_fin?: string }): Promise<ApiResponse<AsistenciaStatsJudoka[]>> {
    if (!senseiId) {
      return { success: false, error: 'El ID del sensei es requerido' }
    }

    // 1. Obtener todas las sesiones del sensei en el rango
    const sesionesRes = await asistenciaService.getBySensei(senseiId)
    if (!sesionesRes.success || !sesionesRes.data) {
      return { success: false, error: sesionesRes.error || 'Error al obtener sesiones del sensei' }
    }

    let sesionesIds = sesionesRes.data.map(s => s.id)
    // Filtrar sesiones por fecha si hay filtros
    if (filtros?.fecha_inicio || filtros?.fecha_fin) {
      sesionesRes.data.filter(s => {
        let ok = true
        if (filtros.fecha_inicio && s.fecha < filtros.fecha_inicio) ok = false
        if (filtros.fecha_fin && s.fecha > filtros.fecha_fin) ok = false
        return ok
      }).map(s => s.id)
    }

    if (sesionesIds.length === 0) {
      return { success: true, data: [] }
    }

    // 2. Obtener todos los detalles de esas sesiones
    // Nota: En una v2 esto se optimizaría con una sola query SQL agregada en el servicio.
    // Para v1 y respetando la arquitectura, orquestamos desde el controlador.
    const todasAsistencias: AsistenciaDetalle[] = []
    for (const sId of sesionesIds) {
      const det = await asistenciaService.getDetalleBySesion(sId)
      if (det.success && det.data) {
        todasAsistencias.push(...det.data)
      }
    }

    // 3. Agrupar por judoka_id
    const statsMap = new Map<string, { presentes: number, total: number }>()
    todasAsistencias.forEach(a => {
      const current = statsMap.get(a.judoka_id) || { presentes: 0, total: 0 }
      statsMap.set(a.judoka_id, {
        presentes: current.presentes + (a.estado === 'presente' ? 1 : 0),
        total: current.total + 1
      })
    })

    const result: AsistenciaStatsJudoka[] = Array.from(statsMap.entries()).map(([jId, s]) => ({
      judoka_id: jId,
      total_sesiones: s.total,
      presentes: s.presentes,
      ausentes: s.total - s.presentes,
      porcentaje: Number(((s.presentes / s.total) * 100).toFixed(2))
    }))

    return { success: true, data: result }
  },

  /**
   * Obtener reporte global del club (para Encargado)
   */
  async getReporteClub(clubId: string, filtros: { fecha_inicio: string, fecha_fin: string }): Promise<ApiResponse<AsistenciaReporteClub>> {
    if (!clubId) return { success: false, error: 'El ID del club es requerido' }
    
    const sesionesRes = await asistenciaService.getByClub(clubId)
    if (!sesionesRes.success || !sesionesRes.data) {
      return { success: false, error: sesionesRes.error || 'Error al obtener sesiones del club' }
    }

    const sesionesFiltradas = sesionesRes.data.filter(s => 
      s.fecha >= filtros.fecha_inicio && s.fecha <= filtros.fecha_fin
    )

    if (sesionesFiltradas.length === 0) {
      return {
        success: true,
        data: {
          club_id: clubId,
          periodo: filtros,
          stats_globales: { total_sesiones: 0, promedio_asistencia: 0 },
          stats_por_sensei: []
        }
      }
    }

    // Orquestar stats por sensei
    const senseiMap = new Map<string, { nombre: string, total: number, presentes: number, sesiones: Set<string> }>()

    for (const s of sesionesFiltradas) {
      const detRes = await asistenciaService.getDetalleBySesion(s.id)
      if (detRes.success && detRes.data) {
        const entry = senseiMap.get(s.sensei_id) || { 
          nombre: s.nombre_sensei || 'Sensei desconocido', 
          total: 0, 
          presentes: 0, 
          sesiones: new Set() 
        }
        
        entry.sesiones.add(s.id)
        detRes.data.forEach(d => {
          entry.total++
          if (d.estado === 'presente') entry.presentes++
        })
        senseiMap.set(s.sensei_id, entry)
      }
    }

    const stats_por_sensei = Array.from(senseiMap.entries()).map(([id, data]) => ({
      sensei_id: id,
      nombre: data.nombre,
      total_sesiones: data.sesiones.size,
      promedio_asistencia: Number(((data.presentes / data.total) * 100).toFixed(2))
    }))

    const globalTotal = stats_por_sensei.reduce((acc, s) => acc + s.total_sesiones, 0)
    const globalPromedio = stats_por_sensei.length > 0 
      ? stats_por_sensei.reduce((acc, s) => acc + s.promedio_asistencia, 0) / stats_por_sensei.length
      : 0

    return {
      success: true,
      data: {
        club_id: clubId,
        periodo: filtros,
        stats_globales: {
          total_sesiones: globalTotal,
          promedio_asistencia: Number(globalPromedio.toFixed(2))
        },
        stats_por_sensei
      }
    }
  }
}
