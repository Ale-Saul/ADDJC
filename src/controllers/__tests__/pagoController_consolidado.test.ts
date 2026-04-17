import { pagoController } from '../pagoController'
import { pagoService } from '@/services/pagoService'
import { TIPO_DESCUENTO } from '@/constants/pagos'

jest.mock('@/services/pagoService', () => ({
  pagoService: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getByJudoka: jest.fn(),
    getByClub: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn()
  }
}))

describe('pagoController - Consolidación Final de Cobertura v2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
  })

  it('updatePago - debe fallar si no hay tipo de descuento al activar tiene_descuento', async () => {
    ;(pagoService.getById as jest.Mock).mockResolvedValue({ success: true, data: { id: 'p1', estado: 'pendiente', monto_base: 100 } })
    const result = await pagoController.updatePago('p1', { concepto: 'Concepto largo', tiene_descuento: true, tipo_descuento: undefined as any })
    expect(result.success).toBe(false)
    expect(result.error).toContain('tipo de descuento')
  })

  it('updatePago - validación compleja de descuento porcentaje', async () => {
    ;(pagoService.getById as jest.Mock).mockResolvedValue({ success: true, data: { id: 'p1', estado: 'pendiente', monto_base: 100 } })
    // Nota: El error ahora viene de Zod antes que de la lógica manual
    const result = await pagoController.updatePago('p1', { concepto: 'Concepto largo', tiene_descuento: true, tipo_descuento: TIPO_DESCUENTO.PORCENTAJE, descuento_porcentaje: 150 })
    expect(result.success).toBe(false)
  })

  it('updatePago - validación compleja de descuento monto > monto_base', async () => {
    ;(pagoService.getById as jest.Mock).mockResolvedValue({ success: true, data: { id: 'p1', estado: 'pendiente', monto_base: 100 } })
    const result = await pagoController.updatePago('p1', { concepto: 'Concepto largo', tiene_descuento: true, tipo_descuento: TIPO_DESCUENTO.MONTO_FIJO, descuento_monto: 200 })
    expect(result.success).toBe(false)
    expect(result.error).toContain('mayor al monto base')
  })

  it('createPago - error de validacion Zod', async () => {
    const result = await pagoController.createPago({} as any)
    expect(result.success).toBe(false)
  })
})
