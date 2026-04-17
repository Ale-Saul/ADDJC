import { pagoController } from '../pagoController'
import { pagoService } from '@/services/pagoService'

jest.mock('@/services/pagoService', () => ({
  pagoService: {
    getById: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  }
}))

describe('pagoController - Fase 2 Simplificada', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
  })

  it('debe permitir crear un pago sin descuentos (caso base)', async () => {
    const validPago: any = { 
        judoka_id: '00000000-0000-0000-0000-000000000000', 
        club_id: '00000000-0000-0000-0000-000000000000', 
        creador_id: '00000000-0000-0000-0000-000000000000',
        tipo_pago: 'mensualidad',
        concepto: 'Pago General Mensual',
        monto_base: 100,
        tiene_descuento: false,
        tipo_descuento: 'ninguno',
        estado: 'pendiente',
        fecha_vencimiento: '2024-01-01',
        activo: true
    }
    ;(pagoService.create as jest.Mock).mockResolvedValue({ success: true, data: {} })
    const result = await pagoController.createPago(validPago)
    expect(result.success).toBe(true)
  })

  it('R2 - bloqueo de edicion', async () => {
    ;(pagoService.getById as jest.Mock).mockResolvedValue({ success: true, data: { id: 'p1', estado: 'pago' } })
    const result = await pagoController.updatePago('p1', { monto_final: 999 })
    expect(result.success).toBe(false)
  })
})
