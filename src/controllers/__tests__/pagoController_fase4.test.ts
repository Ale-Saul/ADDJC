import { pagoController } from '../pagoController'
import { pagoService } from '@/services/pagoService'

jest.mock('@/services/pagoService', () => ({
  pagoService: {
    getAll: jest.fn()
  }
}))

describe('pagoController - Fase 4: Reportes de Asociación (R1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
  })

  it('R1 - debe generar el reporte consolidado para la asociación', async () => {
    const mockPagos: any[] = [
      { id: '1', monto_final: 100, estado: 'pago' },
      { id: '2', monto_final: 200, estado: 'pago' },
      { id: '3', monto_final: 50, estado: 'pendiente' }
    ]
    ;(pagoService.getAll as jest.Mock).mockResolvedValue({ success: true, data: mockPagos })
    
    const result = await (pagoController as any).getReporteConsolidadoAsociacion()
    
    expect(result.success).toBe(true)
    expect(result.data.totalRecaudado).toBe(300)
    expect(result.data.cantidadPagos).toBe(3)
    expect(result.data.pagosCompletados).toBe(2)
  })

  it('debe manejar errores del servicio en el reporte consolidado', async () => {
    ;(pagoService.getAll as jest.Mock).mockResolvedValue({ success: false, error: 'Database error' })
    const result = await (pagoController as any).getReporteConsolidadoAsociacion()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Database error')
  })
})
