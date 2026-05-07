import { pagoService } from '@/services/pagoService'
import { Pago, PagoCreate, PagoUpdate } from '@/models/pago'
import { ApiResponse } from '@/types/globales'
import { ESTADO_PAGO, TIPO_DESCUENTO } from '@/constants/pagos'
import { createPagoSchema, updatePagoSchema } from '@/schemas/pagoSchema'
import { comunicacionController } from '@/controllers/comunicacionController'
import { comunicacionService } from '@/services/comunicacionService'

export const pagoController = {
  /**
   * Obtener todos los pagos
   */
  async getAllPagos(includeInactive: boolean = false): Promise<ApiResponse<Pago[]>> {
    return await pagoService.getAll(includeInactive)
  },

  /**
   * Obtener pagos por judoka
   */
  async getPagosByJudoka(judokaId: string): Promise<ApiResponse<Pago[]>> {
    if (!judokaId) {
      return { success: false, error: 'ID del judoka es requerido' }
    }

    return await pagoService.getByJudoka(judokaId)
  },

  /**
   * Obtener pagos por club
   */
  async getPagosByClub(clubId: string): Promise<ApiResponse<Pago[]>> {
    if (!clubId) {
      return { success: false, error: 'ID del club es requerido' }
    }

    return await pagoService.getByClub(clubId)
  },

  /**
   * Obtener pagos pendientes (Reporte)
   */
  async getPagosPendientes(): Promise<ApiResponse<Pago[]>> {
    const response = await pagoService.getAll()
    if (!response.success) return response
    return {
      success: true,
      data: response.data?.filter(p => p.estado === 'pendiente') || []
    }
  },

  /**
   * Obtener pagos por rango de fechas (Reporte Temporal)
   */
  async getPagosPorRango(inicio: string, fin: string): Promise<ApiResponse<Pago[]>> {
    const response = await pagoService.getAll()
    if (!response.success) return response
    
    const dInicio = new Date(inicio)
    const dFin = new Date(fin)
    
    return {
      success: true,
      data: response.data?.filter(p => {
        const dPago = new Date(p.created_at || '')
        return dPago >= dInicio && dPago <= dFin
      }) || []
    }
  },

  /**
   * Generar reporte consolidado para la asociación (R1)
   */
  async getReporteConsolidadoAsociacion(): Promise<ApiResponse<any>> {
    const response = await pagoService.getAll()
    if (!response.success) return response

    const pagos = response.data || []
    const totalRecaudado = pagos
      .filter(p => p.estado === 'pagado' || (p.estado as string) === 'completado')
      .reduce((sum, p) => sum + (p.monto_final || 0), 0)

    const reporte = {
      totalRecaudado,
      cantidadPagos: pagos.length,
      pagosCompletados: pagos.filter(p => p.estado === 'pagado' || (p.estado as string) === 'completado').length,
      pagosPendientes: pagos.filter(p => p.estado === 'pendiente').length
    }

    return {
      success: true,
      data: reporte
    }
  },

  /**
   * Obtener un pago por ID
   */
  async getPagoById(id: string): Promise<ApiResponse<Pago>> {
    if (!id) {
      return { success: false, error: 'ID del pago es requerido' }
    }

    return await pagoService.getById(id)
  },

  /**
   * Crear un nuevo pago
   */
  async createPago(pagoData: PagoCreate): Promise<ApiResponse<Pago>> {
    // Validación con Zod
    const validation = createPagoSchema.safeParse(pagoData)
    
    if (!validation.success) {
      const errorMessage = validation.error.issues.map(e => e.message).join(', ')
      return { success: false, error: errorMessage }
    }

    // Usar los datos validados y transformados por Zod
    const validatedData = validation.data as PagoCreate

    // R3 - Cálculo automático de monto_final
    let montoFinal = validatedData.monto_base
    if (validatedData.tiene_descuento && validatedData.tipo_descuento) {
      if (validatedData.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE && validatedData.descuento_porcentaje) {
        montoFinal = validatedData.monto_base - (validatedData.monto_base * (validatedData.descuento_porcentaje / 100))
      } else if (validatedData.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && validatedData.descuento_monto) {
        montoFinal = validatedData.monto_base - validatedData.descuento_monto
      }
    }
    validatedData.monto_final = montoFinal

    const result = await pagoService.create(validatedData)

    if (result.success && result.data) {
      const pago = result.data
      const judokaResult = await pagoService.getUsuarioIdByJudoka(pago.judoka_id)
      if (judokaResult.success && judokaResult.data) {
        const fechaFormateada = new Date(pago.fecha_vencimiento).toLocaleDateString('es-BO', {
          day: '2-digit', month: 'long', year: 'numeric',
        })
        const notifResult = await comunicacionController.enviarNotificacion({
          usuario_id: judokaResult.data,
          titulo: `Nuevo pago registrado: ${pago.concepto}`,
          mensaje: `Se registró un pago de Bs. ${pago.monto_final} por "${pago.concepto}". Fecha límite de pago: ${fechaFormateada}.`,
          tipo: 'pago',
          prioridad: 'normal',
          link_accion: '/pagos/pendientes',
          origen_modulo: 'tesoreria_pago_creacion',
          origen_id: pago.id,
        })

        if (!notifResult.success) {
          console.error('No se pudo notificar el nuevo pago:', notifResult.error)
        }
      }
    }

    return result
  },

  /**
   * Obtener pagos pendientes de un usuario judoka.
   */
  async getPagosPendientesByUsuario(usuarioId: string): Promise<ApiResponse<Pago[]>> {
    if (!usuarioId) {
      return { success: false, error: 'ID de usuario requerido' }
    }

    const judokaResult = await pagoService.getJudokaIdByUsuario(usuarioId)
    if (!judokaResult.success || !judokaResult.data) {
      return { success: false, error: 'No se encontró el perfil de judoka asociado al usuario' }
    }

    const pagosResult = await pagoService.getByJudoka(judokaResult.data)
    if (!pagosResult.success) return pagosResult

    const estadosResueltos = new Set<string>([
      ESTADO_PAGO.PAGADO,
      ESTADO_PAGO.CANCELADO,
      ESTADO_PAGO.REEMBOLSADO,
      'pago',
      'completado',
    ])
    const pendientes = (pagosResult.data ?? []).filter(pago => !estadosResueltos.has(pago.estado))

    return { success: true, data: pendientes }
  },

  /**
   * Obtener historial de pagos resueltos de un usuario judoka.
   */
  async getPagosHistorialByUsuario(usuarioId: string): Promise<ApiResponse<Pago[]>> {
    if (!usuarioId) {
      return { success: false, error: 'ID de usuario requerido' }
    }

    const judokaResult = await pagoService.getJudokaIdByUsuario(usuarioId)
    if (!judokaResult.success || !judokaResult.data) {
      return { success: false, error: 'No se encontró el perfil de judoka asociado al usuario' }
    }

    const pagosResult = await pagoService.getByJudoka(judokaResult.data)
    if (!pagosResult.success) return pagosResult

    const estadosResueltos = new Set<string>([
      ESTADO_PAGO.PAGADO,
      ESTADO_PAGO.CANCELADO,
      ESTADO_PAGO.REEMBOLSADO,
      'pago',
      'completado',
    ])
    const historial = (pagosResult.data ?? []).filter(pago => estadosResueltos.has(pago.estado))

    return { success: true, data: historial }
  },

  /**
   * Verifica los pagos pendientes que vencen mañana para el club indicado
   * y envía notificaciones de alerta a los judokas que aún no las recibieron.
   * Se llama al cargar la página de Pagos para alertas proactivas.
   */
  async checkPagosProximosAVencer(clubId: string): Promise<void> {
    if (!clubId) return

    const pagosResult = await pagoService.getPagosProximosAVencer(clubId)
    if (!pagosResult.success || !pagosResult.data?.length) return

    for (const pago of pagosResult.data) {
      const judokaResult = await pagoService.getUsuarioIdByJudoka(pago.judoka_id)
      if (!judokaResult.success || !judokaResult.data) continue

      const usuarioId = judokaResult.data
      const yaNotificado = await comunicacionService.existeNotificacionOrigen(
        usuarioId, pago.id, 'tesoreria_pago_vencimiento'
      )
      if (yaNotificado) continue

      const fechaFormateada = new Date(pago.fecha_vencimiento).toLocaleDateString('es-BO', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
      comunicacionController.notificarPagoPendiente(usuarioId, {
        monto: pago.monto_final,
        vencimiento: fechaFormateada,
        pagoId: pago.id,
      }).catch(() => { /* notificación no crítica */ })
    }
  },

  /**
   * Actualizar un pago
   */
  async updatePago(id: string, pagoData: PagoUpdate): Promise<ApiResponse<Pago>> {
    if (!id) {
      return { success: false, error: 'ID del pago es requerido' }
    }

    // Validar que el pago existe
    const existingResult = await pagoService.getById(id)
    if (!existingResult.success || !existingResult.data) {
      return { success: false, error: 'Pago no encontrado' }
    }

    const existingPago = existingResult.data

    // R2 - Inmutabilidad: No editar si ya está pagado
    if (existingPago.estado === 'pagado' || (existingPago.estado as string) === 'completado') {
      if (pagoData.monto_final !== undefined || pagoData.monto_base !== undefined) {
        return { success: false, error: 'Un pago completado está bloqueado para edición de montos' }
      }
    }

    // Validación básica de campos con Zod
    const validation = updatePagoSchema.safeParse(pagoData)
    if (!validation.success) {
      const errorMessage = validation.error.issues.map(e => e.message).join(', ')
      return { success: false, error: errorMessage }
    }

    // Validaciones complejas que dependen del estado actual (DB)
    // Validar descuentos si se actualizan o si se activa el descuento
    if (pagoData.tiene_descuento !== undefined && pagoData.tiene_descuento) {
      const montoBase = pagoData.monto_base || existingPago.monto_base
      const tipoDescuento = pagoData.tipo_descuento || existingPago.tipo_descuento

      if (!tipoDescuento) {
        return { success: false, error: 'Debe especificar el tipo de descuento' }
      }

      if (tipoDescuento === TIPO_DESCUENTO.PORCENTAJE) {
        const descuentoPorcentaje = pagoData.descuento_porcentaje !== undefined 
          ? pagoData.descuento_porcentaje 
          : existingPago.descuento_porcentaje

        if (descuentoPorcentaje === null || descuentoPorcentaje === undefined || descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
          return { success: false, error: 'El descuento por porcentaje debe estar entre 0 y 100' }
        }
      } else if (tipoDescuento === TIPO_DESCUENTO.MONTO_FIJO) {
        const descuentoMonto = pagoData.descuento_monto !== undefined 
          ? pagoData.descuento_monto 
          : existingPago.descuento_monto

        if (descuentoMonto === null || descuentoMonto === undefined || descuentoMonto <= 0) {
          return { success: false, error: 'El descuento en monto debe ser mayor a 0' }
        }
        if (descuentoMonto > montoBase) {
          return { success: false, error: 'El descuento no puede ser mayor al monto base' }
        }
      }
    }

    const result = await pagoService.update(id, pagoData)

    const estadosPagados = new Set<string>([ESTADO_PAGO.PAGADO, 'pago', 'completado'])
    const estabaPagado = estadosPagados.has(existingPago.estado)
    const quedoPagado = result.success && result.data ? estadosPagados.has(result.data.estado) : false

    if (result.success && result.data && !estabaPagado && quedoPagado) {
      const pago = result.data
      const judokaResult = await pagoService.getUsuarioIdByJudoka(pago.judoka_id)

      if (judokaResult.success && judokaResult.data) {
        const notifResult = await comunicacionController.enviarNotificacion({
          usuario_id: judokaResult.data,
          titulo: `Pago confirmado: ${pago.concepto}`,
          mensaje: `Se confirmó tu pago de Bs. ${pago.monto_final} por "${pago.concepto}". Gracias por mantener tus pagos al día.`,
          tipo: 'pago',
          prioridad: 'normal',
          link_accion: '/pagos/pendientes',
          origen_modulo: 'tesoreria_pago_confirmacion',
          origen_id: pago.id,
        })

        if (!notifResult.success) {
          console.error('No se pudo notificar la confirmación de pago:', notifResult.error)
        }
      }
    }

    return result
  },

  /**
   * Eliminar un pago (soft delete)
   */
  async deletePago(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return { success: false, error: 'ID del pago es requerido' }
    }

    // Validar que el pago existe
    const existingPago = await pagoService.getById(id)
    if (!existingPago.success || !existingPago.data) {
      return { success: false, error: 'Pago no encontrado' }
    }

    return await pagoService.delete(id)
  },

  /**
   * Restaurar un pago
   */
  async restorePago(id: string): Promise<ApiResponse<Pago>> {
    if (!id) {
      return { success: false, error: 'ID del pago es requerido' }
    }

    return await pagoService.restore(id)
  }
}
