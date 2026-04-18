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
  }
}
