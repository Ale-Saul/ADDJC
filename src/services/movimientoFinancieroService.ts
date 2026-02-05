/**
 * Servicio de Movimientos Financieros
 * Gestión de ingresos y egresos de la asociación
 */

import { createClient } from '@/lib/supabase/client';
import {
  MovimientoFinanciero,
  MovimientoFinancieroInput,
  MovimientoFinancieroUpdate,
  BalanceFinanciero,
  ResumenPorCategoria,
  MovimientosPorMes,
} from '@/models/movimientoFinanciero';

/**
 * Obtener todos los movimientos financieros con información relacionada
 */
export async function getAllMovimientos(): Promise<MovimientoFinanciero[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_financieros')
    .select(`
      *,
      clubes:origen_club_id (
        nombre_club
      ),
      usuarios:created_by (
        correo
      )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener movimientos financieros:', error);
    throw new Error(`Error al obtener movimientos financieros: ${error.message}`);
  }

  return (data || []).map((mov: any) => ({
    ...mov,
    origen_club_nombre: mov.clubes?.nombre_club,
    created_by_email: mov.usuarios?.correo,
  }));
}

/**
 * Obtener movimientos financieros filtrados por rango de fechas
 */
export async function getMovimientosByDateRange(
  fechaInicio: string,
  fechaFin: string
): Promise<MovimientoFinanciero[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_financieros')
    .select(`
      *,
      clubes:origen_club_id (
        nombre_club
      ),
      usuarios:created_by (
        correo
      )
    `)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener movimientos por rango de fechas:', error);
    throw new Error(`Error al obtener movimientos: ${error.message}`);
  }

  return (data || []).map((mov: any) => ({
    ...mov,
    origen_club_nombre: mov.clubes?.nombre_club,
    created_by_email: mov.usuarios?.correo,
  }));
}

/**
 * Obtener un movimiento financiero por ID
 */
export async function getMovimientoById(id: string): Promise<MovimientoFinanciero | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_financieros')
    .select(`
      *,
      clubes:origen_club_id (
        nombre_club
      ),
      usuarios:created_by (
        correo
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error al obtener movimiento financiero:', error);
    throw new Error(`Error al obtener movimiento: ${error.message}`);
  }

  if (!data) return null;

  return {
    ...data,
    origen_club_nombre: data.clubes?.nombre_club,
    created_by_email: data.usuarios?.correo,
  };
}

/**
 * Crear un nuevo movimiento financiero
 */
export async function createMovimiento(
  movimiento: MovimientoFinancieroInput,
  userId: string
): Promise<MovimientoFinanciero> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_financieros')
    .insert({
      ...movimiento,
      created_by: userId,
    })
    .select(`
      *,
      clubes:origen_club_id (
        nombre_club
      ),
      usuarios:created_by (
        correo
      )
    `)
    .single();

  if (error) {
    console.error('Error al crear movimiento financiero:', error);
    throw new Error(`Error al crear movimiento: ${error.message}`);
  }

  return {
    ...data,
    origen_club_nombre: data.clubes?.nombre_club,
    created_by_email: data.usuarios?.correo,
  };
}

/**
 * Actualizar un movimiento financiero existente
 */
export async function updateMovimiento(
  id: string,
  updates: MovimientoFinancieroUpdate
): Promise<MovimientoFinanciero> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_financieros')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      clubes:origen_club_id (
        nombre_club
      ),
      usuarios:created_by (
        correo
      )
    `)
    .single();

  if (error) {
    console.error('Error al actualizar movimiento financiero:', error);
    throw new Error(`Error al actualizar movimiento: ${error.message}`);
  }

  return {
    ...data,
    origen_club_nombre: data.clubes?.nombre_club,
    created_by_email: data.usuarios?.correo,
  };
}

/**
 * Eliminar un movimiento financiero
 */
export async function deleteMovimiento(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('movimientos_financieros')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar movimiento financiero:', error);
    throw new Error(`Error al eliminar movimiento: ${error.message}`);
  }
}

/**
 * Anular un movimiento financiero (cambiar estado a 'anulado')
 */
export async function anularMovimiento(id: string): Promise<MovimientoFinanciero> {
  return updateMovimiento(id, { estado: 'anulado' });
}

/**
 * Calcular balance financiero para un período
 */
export async function getBalance(
  fechaInicio: string,
  fechaFin: string
): Promise<BalanceFinanciero> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_financieros')
    .select('tipo, monto')
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .neq('estado', 'anulado');

  if (error) {
    console.error('Error al calcular balance:', error);
    throw new Error(`Error al calcular balance: ${error.message}`);
  }

  const movimientos = data || [];
  const ingresos = movimientos
    .filter((m: any) => m.tipo === 'ingreso')
    .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);
  
  const egresos = movimientos
    .filter((m: any) => m.tipo === 'egreso')
    .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);

  return {
    total_ingresos: ingresos,
    total_egresos: egresos,
    balance: ingresos - egresos,
    periodo_inicio: fechaInicio,
    periodo_fin: fechaFin,
  };
}

/**
 * Obtener resumen agrupado por categoría
 */
export async function getResumenPorCategoria(
  fechaInicio?: string,
  fechaFin?: string
): Promise<ResumenPorCategoria[]> {
  const supabase = createClient()
  let query = supabase
    .from('movimientos_financieros')
    .select('tipo, categoria, monto')
    .neq('estado', 'anulado');

  if (fechaInicio) {
    query = query.gte('fecha', fechaInicio);
  }
  if (fechaFin) {
    query = query.lte('fecha', fechaFin);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener resumen por categoría:', error);
    throw new Error(`Error al obtener resumen: ${error.message}`);
  }

  // Agrupar manualmente en cliente
  const agrupado: { [key: string]: ResumenPorCategoria } = {};
  
  (data || []).forEach((mov: any) => {
    const key = `${mov.tipo}-${mov.categoria}`;
    if (!agrupado[key]) {
      agrupado[key] = {
        tipo: mov.tipo,
        categoria: mov.categoria,
        total: 0,
        cantidad: 0,
      };
    }
    agrupado[key].total += parseFloat(mov.monto);
    agrupado[key].cantidad += 1;
  });

  return Object.values(agrupado);
}

/**
 * Obtener movimientos agrupados por mes
 */
export async function getMovimientosPorMes(
  anio?: number
): Promise<MovimientosPorMes[]> {
  const supabase = createClient()
  let query = supabase
    .from('movimientos_financieros')
    .select('fecha, tipo, monto')
    .neq('estado', 'anulado')
    .order('fecha', { ascending: true });

  if (anio) {
    const fechaInicio = `${anio}-01-01`;
    const fechaFin = `${anio}-12-31`;
    query = query.gte('fecha', fechaInicio).lte('fecha', fechaFin);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener movimientos por mes:', error);
    throw new Error(`Error al obtener movimientos por mes: ${error.message}`);
  }

  // Agrupar por mes
  const agrupado: { [key: string]: MovimientosPorMes } = {};

  (data || []).forEach((mov: any) => {
    const mes = mov.fecha.substring(0, 7); // 'YYYY-MM'
    if (!agrupado[mes]) {
      agrupado[mes] = {
        mes,
        ingresos: 0,
        egresos: 0,
        balance: 0,
      };
    }

    const monto = parseFloat(mov.monto);
    if (mov.tipo === 'ingreso') {
      agrupado[mes].ingresos += monto;
    } else {
      agrupado[mes].egresos += monto;
    }
    agrupado[mes].balance = agrupado[mes].ingresos - agrupado[mes].egresos;
  });

  return Object.values(agrupado).sort((a, b) => a.mes.localeCompare(b.mes));
}
