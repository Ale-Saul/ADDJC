import { pagoService } from '@/services/pagoService'
import { Pago, PagoCreate, PagoUpdate } from '@/models/pago'
import { ApiResponse } from '@/types'
import { TIPO_DESCUENTO } from '@/constants/pagos'
import { createPagoSchema, updatePagoSchema } from '@/schemas/pagoSchema'

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
    // Validación con Zod
    const validation = createPagoSchema.safeParse(pagoData)
    
    if (!validation.success) {
      const errorMessage = validation.error.issues.map(e => e.message).join(', ')
      return { success: false, error: errorMessage }
    }

    // Usar los datos validados y transformados por Zod
    const validatedData = validation.data as PagoCreate

    return await pagoService.create(validatedData)
  },

  /**
   * Actualizar un pago
   */
  async updatePago(id: string, pagoData: PagoUpdate): Promise<ApiResponse<Pago>> {
    if (!id) {
      return { success: false, error: 'ID del pago es requerido' }
    }

    // Validación básica de campos con Zod
    const validation = updatePagoSchema.safeParse(pagoData)
    if (!validation.success) {
      const errorMessage = validation.error.issues.map(e => e.message).join(', ')
      return { success: false, error: errorMessage }
    }

    // Validar que el pago existe
    const existingPago = await pagoService.getById(id)
    if (!existingPago.success || !existingPago.data) {
      return { success: false, error: 'Pago no encontrado' }
    }

    // Validaciones complejas que dependen del estado actual (DB)
    // Validar descuentos si se actualizan o si se activa el descuento
    if (pagoData.tiene_descuento !== undefined && pagoData.tiene_descuento) {
      const montoBase = pagoData.monto_base || existingPago.data.monto_base
      const tipoDescuento = pagoData.tipo_descuento || existingPago.data.tipo_descuento

      if (!tipoDescuento) {
        return { success: false, error: 'Debe especificar el tipo de descuento' }
      }

      if (tipoDescuento === TIPO_DESCUENTO.PORCENTAJE) {
        const descuentoPorcentaje = pagoData.descuento_porcentaje !== undefined 
          ? pagoData.descuento_porcentaje 
          : existingPago.data.descuento_porcentaje

        if (descuentoPorcentaje === null || descuentoPorcentaje === undefined || descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
          return { success: false, error: 'El descuento por porcentaje debe estar entre 0 y 100' }
        }
      } else if (tipoDescuento === TIPO_DESCUENTO.MONTO_FIJO) {
        const descuentoMonto = pagoData.descuento_monto !== undefined 
          ? pagoData.descuento_monto 
          : existingPago.data.descuento_monto

        if (descuentoMonto === null || descuentoMonto === undefined || descuentoMonto <= 0) {
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
