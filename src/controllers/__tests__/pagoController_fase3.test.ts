import { pagoController } from '../pagoController'
import { pagoService } from '@/services/pagoService'

jest.mock('@/services/pagoService', () => ({
  pagoService: {
    getAll: jest.fn(),
    getByJudoka: jest.fn(),
    getByClub: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  }
}))

describe('pagoController - Fase 3: Reportes y Listados Especializados', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
  })

  it('R5 - debe filtrar pagos pendientes (Listado Especializado)', async () => {
    const mockPagos: any[] = [
      { id: '1', estado: 'pendiente', concepto: 'Enero' },
      { id: '2', estado: 'pago', concepto: 'Febrero' },
      { id: '3', estado: 'pendiente', concepto: 'Marzo' }
    ]
    ;(pagoService.getAll as jest.Mock).mockResolvedValue({ success: true, data: mockPagos })
    
    const result = await pagoController.getPagosPendientes()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.data.every((p: any) => p.estado === 'pendiente')).toBe(true)
  })

  it('R6 - debe filtrar pagos por club (Reporte de Club)', async () => {
    const clubId = 'club-123'
    const mockPagos: any[] = [
      { id: '1', club_id: clubId, monto_final: 100 },
      { id: '2', club_id: clubId, monto_final: 150 }
    ]
    ;(pagoService.getByClub as jest.Mock).mockResolvedValue({ success: true, data: mockPagos })
    
    const result = await pagoController.getPagosByClub(clubId)
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(pagoService.getByClub).toHaveBeenCalledWith(clubId)
  })

  it('R7 - debe poder filtrar pagos por rango de fechas (Reporte Temporal)', async () => {
    const mockPagos: any[] = [
      { id: '1', created_at: '2024-01-15T10:00:00Z', monto_final: 100 },
      { id: '2', created_at: '2024-02-15T10:00:00Z', monto_final: 200 }
    ]
    ;(pagoService.getAll as jest.Mock).mockResolvedValue({ success: true, data: mockPagos })
    
    const result = await pagoController.getPagosPorRango('2024-01-01', '2024-01-31')
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe('1')
  })
})
