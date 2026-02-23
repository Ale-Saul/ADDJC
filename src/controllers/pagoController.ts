import { pagoService } from '@/services/pagoService'
import { Pago, PagoCreate, PagoUpdate } from '@/models/pago'
import { ApiResponse } from '@/types'

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
    // Validaciones de negocio
    if (!pagoData.judoka_id || pagoData.judoka_id.trim() === '') {
      return { success: false, error: 'El ID del judoka es requerido' }
    }

    if (!pagoData.club_id || pagoData.club_id.trim() === '') {
      return { success: false, error: 'El ID del club es requerido' }
    }

    if (!pagoData.concepto || pagoData.concepto.trim() === '') {
      return { success: false, error: 'El concepto es requerido' }
    }

    if (pagoData.concepto.length < 3) {
      return { success: false, error: 'El concepto debe tener al menos 3 caracteres' }
    }

    if (pagoData.concepto.length > 255) {
      return { success: false, error: 'El concepto no puede exceder 255 caracteres' }
    }

    if (!pagoData.monto_base || pagoData.monto_base <= 0) {
      return { success: false, error: 'El monto base debe ser mayor a 0' }
    }

    if (!pagoData.fecha_vencimiento || pagoData.fecha_vencimiento.trim() === '') {
      return { success: false, error: 'La fecha de vencimiento es requerida' }
    }

    if (!pagoData.creador_id || pagoData.creador_id.trim() === '') {
      return { success: false, error: 'El ID del creador es requerido' }
    }

    // Validar descuentos si los hay
    if (pagoData.tiene_descuento) {
      if (!pagoData.tipo_descuento) {
        return { success: false, error: 'Debe especificar el tipo de descuento' }
      }

      if (pagoData.tipo_descuento === 'porcentaje') {
        if (!pagoData.descuento_porcentaje || pagoData.descuento_porcentaje < 0 || pagoData.descuento_porcentaje > 100) {
          return { success: false, error: 'El descuento por porcentaje debe estar entre 0 y 100' }
        }
      } else if (pagoData.tipo_descuento === 'monto_fijo') {
        if (!pagoData.descuento_monto || pagoData.descuento_monto < 0) {
          return { success: false, error: 'El descuento en monto debe ser mayor a 0' }
        }
        if (pagoData.descuento_monto > pagoData.monto_base) {
          return { success: false, error: 'El descuento no puede ser mayor al monto base' }
        }
      }
    }

    // Por defecto, el pago se crea como activo y pendiente
    const pagoToCreate: PagoCreate = {
      ...pagoData,
      activo: pagoData.activo !== undefined ? pagoData.activo : true,
      estado: pagoData.estado || 'pendiente',
      tiene_descuento: pagoData.tiene_descuento || false
    }

    return await pagoService.create(pagoToCreate)
  },

  /**
   * Actualizar un pago
   */
  async updatePago(id: string, pagoData: PagoUpdate): Promise<ApiResponse<Pago>> {
    if (!id) {
      return { success: false, error: 'ID del pago es requerido' }
    }

    // Validar que el pago existe
    const existingPago = await pagoService.getById(id)
    if (!existingPago.success || !existingPago.data) {
      return { success: false, error: 'Pago no encontrado' }
    }

    // Validaciones de negocio
    if (pagoData.concepto !== undefined) {
      if (pagoData.concepto.trim() === '') {
        return { success: false, error: 'El concepto no puede estar vacío' }
      }

      if (pagoData.concepto.length < 3) {
        return { success: false, error: 'El concepto debe tener al menos 3 caracteres' }
      }

      if (pagoData.concepto.length > 255) {
        return { success: false, error: 'El concepto no puede exceder 255 caracteres' }
      }
    }

    if (pagoData.monto_base !== undefined && pagoData.monto_base !== null) {
      if (pagoData.monto_base <= 0) {
        return { success: false, error: 'El monto base debe ser mayor a 0' }
      }
    }

    // Validar descuentos si se actualizan
    if (pagoData.tiene_descuento !== undefined && pagoData.tiene_descuento) {
      const montoBase = pagoData.monto_base || existingPago.data.monto_base
      const tipoDescuento = pagoData.tipo_descuento || existingPago.data.tipo_descuento

      if (!tipoDescuento) {
        return { success: false, error: 'Debe especificar el tipo de descuento' }
      }

      if (tipoDescuento === 'porcentaje') {
        const descuentoPorcentaje = pagoData.descuento_porcentaje !== undefined 
          ? pagoData.descuento_porcentaje 
          : existingPago.data.descuento_porcentaje

        if (!descuentoPorcentaje || descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
          return { success: false, error: 'El descuento por porcentaje debe estar entre 0 y 100' }
        }
      } else if (tipoDescuento === 'monto_fijo') {
        const descuentoMonto = pagoData.descuento_monto !== undefined 
          ? pagoData.descuento_monto 
          : existingPago.data.descuento_monto

        if (!descuentoMonto || descuentoMonto < 0) {
          return { success: false, error: 'El descuento en monto debe ser mayor a 0' }
        }
        if (descuentoMonto > montoBase) {
          return { success: false, error: 'El descuento no puede ser mayor al monto base' }
        }
      }
    }

    return await pagoService.update(id, pagoData)
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
