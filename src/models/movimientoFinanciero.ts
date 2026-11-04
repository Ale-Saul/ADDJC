/**
 * Modelo de MovimientoFinanciero
 * Representa los ingresos y egresos de la asociación para transparencia financiera
 */

export type TipoMovimiento = 'ingreso' | 'egreso';

export type CategoriaMovimiento = 
  | 'donacion_club'           // Donación de un club
  | 'pago_club'              // Pago de un club (cuotas, inscripciones)
  | 'aporte_estado'          // Aporte del gobierno/estado
  | 'sponsor'                // Patrocinio o sponsoreo
  | 'evento'                 // Ingreso/gasto de eventos
  | 'gasto_operativo'        // Gastos operativos generales
  | 'gastos_operativos'      // Gastos operativos generales
  | 'pago_proveedor'         // Pago a proveedores
  | 'pago_arbitro'           // Pago de arbitraje
  | 'equipamiento'           // Compra de balones / material deportivo
  | 'indumentaria'           // Compra de uniformes / indumentaria
  | 'mantenimiento'          // Mantenimiento de canchas/instalaciones
  | 'transporte_viaticos'    // Transporte o viáticos
  | 'inscripcion_torneo'     // Inscripción a torneos
  | 'alquiler_cancha'        // Alquiler de cancha / instalaciones
  | 'pago_entrenador'        // Pago de sueldo o viático a entrenadores
  | 'cuota_mensual'          // Cuota mensual de deportistas
  | 'matricula_inscripcion'  // Matrícula o inscripción
  | 'venta_indumentaria'     // Venta de camisetas/indumentaria
  | 'otro';                  // Otros conceptos

export type EstadoMovimiento = 
  | 'registrado'     // Movimiento registrado
  | 'aprobado'       // Aprobado (para futuro flujo de aprobación)
  | 'anulado';       // Anulado (visible en página pero bloqueado para ediciones)

export interface MovimientoFinanciero {
  id: string;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  monto: number;
  concepto: string;                    // Título del movimiento
  descripcion?: string;                // Descripción detallada opcional
  fecha: string;                       // Fecha del movimiento (ISO 8601)
  origen_club_id?: string;             // ID del club (si aplica)
  origen_club_nombre?: string;         // Nombre del club (join)
  origen_entidad?: string;             // Nombre de la entidad externa (estado, sponsor, etc)
  comprobante_url?: string;            // URL del comprobante (PDF/imagen en storage)
  comprobante_nombre?: string;
  estado: EstadoMovimiento;
  activo: boolean;                     // Si false, oculto de la página (soft delete)
  notas?: string;                      // Notas adicionales
  created_at: string;
  updated_at: string;
  created_by: string;                  // ID del usuario que creó
  created_by_email?: string;           // Email del usuario (join)
}

export interface MovimientoFinancieroInput {
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  monto: number;
  concepto: string;
  descripcion?: string;
  fecha: string;
  origen_club_id?: string;
  origen_entidad?: string;
  comprobante_url?: string;
  comprobante_nombre?: string;
  estado?: EstadoMovimiento;
  notas?: string;
}

export interface MovimientoFinancieroUpdate {
  tipo?: TipoMovimiento;
  categoria?: CategoriaMovimiento;
  monto?: number;
  concepto?: string;
  descripcion?: string;
  fecha?: string;
  origen_club_id?: string;
  origen_entidad?: string;
  comprobante_url?: string;
  comprobante_nombre?: string;
  estado?: EstadoMovimiento;
  activo?: boolean;
  notas?: string;
}

export interface BalanceFinanciero {
  total_ingresos: number;
  total_egresos: number;
  balance: number;                     // ingresos - egresos
  periodo_inicio: string;
  periodo_fin: string;
}

export interface ResumenPorCategoria {
  categoria: CategoriaMovimiento;
  tipo: TipoMovimiento;
  total: number;
  cantidad: number;
}

export interface MovimientosPorMes {
  mes: string;                         // 'YYYY-MM'
  ingresos: number;
  egresos: number;
  balance: number;
}


