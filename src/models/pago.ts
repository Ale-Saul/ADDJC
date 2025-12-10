export type TipoPago = 
  | 'cuota_mensual'
  | 'cuota_traje'
  | 'inscripcion'
  | 'examen_grado'
  | 'evento'
  | 'otro'

export type EstadoPago = 
  | 'pendiente'
  | 'pagado'
  | 'vencido'
  | 'parcial'
  | 'cancelado'

export type TipoDescuento = 
  | 'porcentaje'
  | 'monto'

export type RazonDescuento = 
  | 'beca'
  | 'descuento_hermanos'
  | 'descuento_especial'
  | 'promocion'
  | 'ayuda_social'
  | 'ninguna'

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
  creador_id: string
  pagado_por: string | null
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
  pagado_por?: string | null
  activo?: boolean
}
