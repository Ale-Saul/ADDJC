export type TipoPago = 
  | 'mensualidad'
  | 'inscripcion'
  | 'examen'
  | 'torneo'
  | 'evento'
  | 'otro'

export type EstadoPago = 
  | 'pendiente'
  | 'pagado'
  | 'vencido'
  | 'cancelado'
  | 'reembolsado'

export type TipoDescuento = 
  | 'porcentaje'
  | 'monto_fijo'
  | 'ninguno'

export type RazonDescuento = 
  | 'beca'
  | 'promocion'
  | 'hermanos'
  | 'anticipado'
  | 'especial'
  | 'ninguno'

export interface Pago {
  id: string
  judoka_id: string
  club_id: string
  tipo_pago: TipoPago
  concepto: string
  descripcion: string | null
  monto_base: number
  tiene_descuento: boolean
  tipo_descuento: TipoDescuento | null
  descuento_porcentaje: number | null
  descuento_monto: number | null
  razon_descuento: RazonDescuento | null
  monto_final: number
  estado: EstadoPago
  fecha_vencimiento: string
  fecha_pago: string | null
  metodo_pago: string | null
  comprobante_url: string | null
  observaciones_pago: string | null
  creador_id: string
  pagador_id: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface PagoCreate {
  judoka_id: string
  club_id: string
  tipo_pago: TipoPago
  concepto: string
  descripcion?: string | null
  monto_base: number
  tiene_descuento?: boolean
  tipo_descuento?: TipoDescuento | null
  descuento_porcentaje?: number | null
  descuento_monto?: number | null
  razon_descuento?: RazonDescuento | null
  monto_final?: number
  estado?: EstadoPago
  fecha_vencimiento: string
  fecha_pago?: string | null
  metodo_pago?: string | null
  comprobante_url?: string | null
  observaciones_pago?: string | null
  creador_id: string
  activo?: boolean
}

export interface PagoUpdate {
  tipo_pago?: TipoPago
  concepto?: string
  descripcion?: string | null
  monto_base?: number
  tiene_descuento?: boolean
  tipo_descuento?: TipoDescuento | null
  descuento_porcentaje?: number | null
  descuento_monto?: number | null
  razon_descuento?: RazonDescuento | null
  estado?: EstadoPago
  fecha_vencimiento?: string
  fecha_pago?: string | null
  metodo_pago?: string | null
  comprobante_url?: string | null
  observaciones_pago?: string | null
  pagador_id?: string | null
  activo?: boolean
}
