// Tipos globales compartidos
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// Exportar tipos de MovimientoFinanciero
export type {
  MovimientoFinanciero,
  MovimientoFinancieroInput,
  MovimientoFinancieroUpdate,
  BalanceFinanciero,
  ResumenPorCategoria,
  MovimientosPorMes,
  TipoMovimiento,
  CategoriaMovimiento,
  EstadoMovimiento,
} from '@/models/movimientoFinanciero';

