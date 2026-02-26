/**
 * Controlador de Movimientos Financieros
 * Capa de lógica de negocio con validaciones
 */

import {
  MovimientoFinanciero,
  MovimientoFinancieroInput,
  MovimientoFinancieroUpdate,
  BalanceFinanciero,
  ResumenPorCategoria,
  MovimientosPorMes,
  TipoMovimiento,
  CategoriaMovimiento,
} from '@/models/movimientoFinanciero';
import * as movimientoFinancieroService from '@/services/movimientoFinancieroService';
import { ApiResponse } from '@/types';
import { createMovimientoSchema, updateMovimientoSchema } from '@/schemas/movimientoSchema';
import { CATEGORIAS_POR_TIPO, CATEGORIA_MOVIMIENTO_LABELS } from '@/constants/contabilidad';

/**
 * Obtener todos los movimientos financieros
 */
export async function getAllMovimientos(): Promise<ApiResponse<MovimientoFinanciero[]>> {
  try {
    const data = await movimientoFinancieroService.getAllMovimientos();
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al obtener movimientos:', error);
    return { success: false, error: 'No se pudieron obtener los movimientos financieros' };
  }
}

/**
 * Obtener movimientos financieros por rango de fechas
 */
export async function getMovimientosByDateRange(
  fechaInicio: string,
  fechaFin: string
): Promise<ApiResponse<MovimientoFinanciero[]>> {
  // Validar fechas
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return { success: false, error: 'Las fechas proporcionadas no son válidas' };
  }

  if (inicio > fin) {
    return { success: false, error: 'La fecha de inicio no puede ser posterior a la fecha de fin' };
  }

  try {
    const data = await movimientoFinancieroService.getMovimientosByDateRange(fechaInicio, fechaFin);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al obtener movimientos por fecha:', error);
    return { success: false, error: 'No se pudieron obtener los movimientos financieros' };
  }
}

/**
 * Obtener un movimiento financiero por ID
 */
export async function getMovimientoById(id: string): Promise<ApiResponse<MovimientoFinanciero>> {
  if (!id || id.trim() === '') {
    return { success: false, error: 'ID de movimiento inválido' };
  }

  try {
    const data = await movimientoFinancieroService.getMovimientoById(id);
    if (!data) {
      return { success: false, error: 'Movimiento no encontrado' };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al obtener movimiento:', error);
    return { success: false, error: 'No se pudo obtener el movimiento financiero' };
  }
}

/**
 * Crear un nuevo movimiento financiero
 */
export async function createMovimiento(
  movimiento: MovimientoFinancieroInput,
  userId: string
): Promise<ApiResponse<MovimientoFinanciero>> {
  // Validación con Zod
  const validation = createMovimientoSchema.safeParse(movimiento)
  
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(e => e.message).join(', ')
    return { success: false, error: errorMessage }
  }

  if (!userId) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    const data = await movimientoFinancieroService.createMovimiento(movimiento, userId);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al crear movimiento:', error);
    return { success: false, error: 'No se pudo crear el movimiento financiero' };
  }
}

/**
 * Actualizar un movimiento financiero
 */
export async function updateMovimiento(
  id: string,
  updates: MovimientoFinancieroUpdate
): Promise<ApiResponse<MovimientoFinanciero>> {
  if (!id || id.trim() === '') {
    return { success: false, error: 'ID de movimiento inválido' };
  }

  // Validación con Zod
  const validation = updateMovimientoSchema.safeParse(updates)
  
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(e => e.message).join(', ')
    return { success: false, error: errorMessage }
  }

  try {
    const data = await movimientoFinancieroService.updateMovimiento(id, updates);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al actualizar movimiento:', error);
    return { success: false, error: 'No se pudo actualizar el movimiento financiero' };
  }
}

/**
 * Eliminar un movimiento financiero
 */
export async function deleteMovimiento(id: string): Promise<ApiResponse<void>> {
  if (!id || id.trim() === '') {
    return { success: false, error: 'ID de movimiento inválido' };
  }

  try {
    await movimientoFinancieroService.deleteMovimiento(id);
    return { success: true };
  } catch (error: any) {
    console.error('Error en controller al eliminar movimiento:', error);
    return { success: false, error: 'No se pudo eliminar el movimiento financiero' };
  }
}

/**
 * Anular un movimiento financiero (no se elimina, solo cambia estado)
 */
export async function anularMovimiento(id: string): Promise<ApiResponse<MovimientoFinanciero>> {
  if (!id || id.trim() === '') {
    return { success: false, error: 'ID de movimiento inválido' };
  }

  try {
    const data = await movimientoFinancieroService.anularMovimiento(id);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al anular movimiento:', error);
    return { success: false, error: 'No se pudo anular el movimiento financiero' };
  }
}

/**
 * Obtener balance financiero para un período
 */
export async function getBalance(
  fechaInicio: string,
  fechaFin: string
): Promise<ApiResponse<BalanceFinanciero>> {
  // Validar fechas
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return { success: false, error: 'Las fechas proporcionadas no son válidas' };
  }

  if (inicio > fin) {
    return { success: false, error: 'La fecha de inicio no puede ser posterior a la fecha de fin' };
  }

  try {
    const data = await movimientoFinancieroService.getBalance(fechaInicio, fechaFin);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al obtener balance:', error);
    return { success: false, error: 'No se pudo calcular el balance' };
  }
}

/**
 * Obtener resumen agrupado por categoría
 */
export async function getResumenPorCategoria(
  fechaInicio?: string,
  fechaFin?: string
): Promise<ApiResponse<ResumenPorCategoria[]>> {
  // Si se proporcionan fechas, validarlas
  if (fechaInicio && fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return { success: false, error: 'Las fechas proporcionadas no son válidas' };
    }

    if (inicio > fin) {
      return { success: false, error: 'La fecha de inicio no puede ser posterior a la fecha de fin' };
    }
  }

  try {
    const data = await movimientoFinancieroService.getResumenPorCategoria(fechaInicio, fechaFin);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al obtener resumen por categoría:', error);
    return { success: false, error: 'No se pudo obtener el resumen por categoría' };
  }
}

/**
 * Obtener movimientos agrupados por mes
 */
export async function getMovimientosPorMes(anio?: number): Promise<ApiResponse<MovimientosPorMes[]>> {
  // Validar año si se proporciona
  if (anio !== undefined) {
    if (anio < 2000 || anio > 2100) {
      return { success: false, error: 'Año no válido' };
    }
  }

  try {
    const data = await movimientoFinancieroService.getMovimientosPorMes(anio);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en controller al obtener movimientos por mes:', error);
    return { success: false, error: 'No se pudo obtener los movimientos por mes' };
  }
}

/**
 * Obtener categorías disponibles según el tipo de movimiento
 */
export function getCategoriasPorTipo(tipo: TipoMovimiento): CategoriaMovimiento[] {
  // @ts-ignore - Validado por constantes
  return CATEGORIAS_POR_TIPO[tipo] || [];
}

/**
 * Obtener labels amigables para categorías
 */
export function getCategoriaLabel(categoria: CategoriaMovimiento): string {
  // @ts-ignore - Validado por constantes
  return CATEGORIA_MOVIMIENTO_LABELS[categoria] || categoria;
}
