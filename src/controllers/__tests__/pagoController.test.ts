import { pagoController } from '../pagoController'
import { pagoService } from '@/services/pagoService'

jest.mock('@/services/pagoService', () => ({
  pagoService: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn()
  }
}))

describe('pagoController - Fase 1 Final: CRUD y Cobertura Completa', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
  })

  it('debe obtener todos los pagos (getAllPagos)', async () => {
    ;(pagoService.getAll as jest.Mock).mockResolvedValue({ success: true, data: [] })
    const result = await pagoController.getAllPagos(true)
    expect(result.success).toBe(true)
    expect(pagoService.getAll).toHaveBeenCalledWith(true)
  })

  it('debe obtener pago por ID (getPagoById)', async () => {
    ;(pagoService.getById as jest.Mock).mockResolvedValue({ success: true, data: { id: 'p1' } })
    const result = await pagoController.getPagoById('p1')
    expect(result.success).toBe(true)
    expect(pagoService.getById).toHaveBeenCalledWith('p1')
  })

  it('debe manejar error si falta ID en getPagoById', async () => {
    const result = await pagoController.getPagoById('')
    expect(result.success).toBe(false)
  })

  it('debe restaurar un pago (restorePago)', async () => {
    ;(pagoService.restore as jest.Mock).mockResolvedValue({ success: true })
    const result = await pagoController.restorePago('p1')
    expect(result.success).toBe(true)
    expect(pagoService.restore).toHaveBeenCalledWith('p1')
  })

  it('debe manejar error si falta ID en restorePago', async () => {
    const result = await pagoController.restorePago('')
    expect(result.success).toBe(false)
  })

  it('debe manejar error si falta ID en deletePago', async () => {
    const result = await pagoController.deletePago('')
    expect(result.success).toBe(false)
  })

  it('debe manejar error si el pago no existe en deletePago', async () => {
    ;(pagoService.getById as jest.Mock).mockResolvedValue({ success: false })
    const result = await pagoController.deletePago('p999')
    expect(result.success).toBe(false)
  })
})
