import { pagoController } from './src/controllers/pagoController'
import { createPagoSchema } from './src/schemas/pagoSchema'

const validPago = { 
  judoka_id: '00000000-0000-0000-0000-000000000000', 
  club_id: '00000000-0000-0000-0000-000000000000', 
  tipo_pago: 'mensualidad',
  concepto: 'Pago de prueba',
  monto_base: 100,
  monto_final: 100,
  estado: 'completado',
  fecha_vencimiento: '2024-01-01',
  mes: 1,
  gestion: 2024,
  metodo_pago: 'efectivo',
  activo: true
}

const validation = createPagoSchema.safeParse(validPago)
if (!validation.success) {
  console.log('ERRORES ZOD:', JSON.stringify(validation.error.format(), null, 2))
} else {
  console.log('VALIDACIÓN EXITOSA')
}
