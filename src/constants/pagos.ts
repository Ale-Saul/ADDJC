export const TIPO_PAGO = {
  MENSUALIDAD: 'mensualidad',
  INSCRIPCION: 'inscripcion',
  EXAMEN: 'examen',
  TORNEO: 'torneo',
  EVENTO: 'evento',
  OTRO: 'otro',
} as const

export const ESTADO_PAGO = {
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado',
  VENCIDO: 'vencido',
  CANCELADO: 'cancelado',
  REEMBOLSADO: 'reembolsado',
} as const

export const TIPO_DESCUENTO = {
  PORCENTAJE: 'porcentaje',
  MONTO_FIJO: 'monto_fijo',
  NINGUNO: 'ninguno',
} as const

export const RAZON_DESCUENTO = {
  BECA: 'beca',
  PROMOCION: 'promocion',
  HERMANOS: 'hermanos',
  ANTICIPADO: 'anticipado',
  ESPECIAL: 'especial',
  NINGUNO: 'ninguno',
} as const

export const METODO_PAGO = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  QR: 'qr',
  TARJETA: 'tarjeta',
  OTRO: 'otro',
} as const

// Labels para UI
export const TIPO_PAGO_LABELS = {
  [TIPO_PAGO.MENSUALIDAD]: 'Mensualidad',
  [TIPO_PAGO.INSCRIPCION]: 'Inscripción',
  [TIPO_PAGO.EXAMEN]: 'Examen',
  [TIPO_PAGO.TORNEO]: 'Torneo',
  [TIPO_PAGO.EVENTO]: 'Evento',
  [TIPO_PAGO.OTRO]: 'Otro',
}

export const TIPO_DESCUENTO_LABELS = {
  [TIPO_DESCUENTO.PORCENTAJE]: 'Porcentaje (%)',
  [TIPO_DESCUENTO.MONTO_FIJO]: 'Monto Fijo',
  [TIPO_DESCUENTO.NINGUNO]: 'Ninguno',
}

export const RAZON_DESCUENTO_LABELS = {
  [RAZON_DESCUENTO.BECA]: 'Beca',
  [RAZON_DESCUENTO.PROMOCION]: 'Promoción',
  [RAZON_DESCUENTO.HERMANOS]: 'Hermanos',
  [RAZON_DESCUENTO.ANTICIPADO]: 'Anticipado',
  [RAZON_DESCUENTO.ESPECIAL]: 'Especial',
  [RAZON_DESCUENTO.NINGUNO]: 'Ninguno',
}

export const METODO_PAGO_LABELS = {
  [METODO_PAGO.EFECTIVO]: 'Efectivo',
  [METODO_PAGO.TRANSFERENCIA]: 'Transferencia Bancaria',
  [METODO_PAGO.QR]: 'QR/Billetera Digital',
  [METODO_PAGO.TARJETA]: 'Tarjeta',
  [METODO_PAGO.OTRO]: 'Otro',
}
