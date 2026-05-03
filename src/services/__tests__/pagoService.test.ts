import { pagoService } from '../pagoService'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('pagoService', () => {
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockOrder = jest.fn()
  const mockEq = jest.fn()
  const mockSingle = jest.fn()
  const mockInsert = jest.fn()
  const mockUpdate = jest.fn()

  const mockSupabase: any = {
    from: mockFrom
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate
    })
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
      single: mockSingle
    })
    
    // Mock default success response for thenable
    const defaultResponse = { data: [], error: null }
    mockOrder.mockImplementation(() => ({
        eq: mockEq,
        then: (cb: any) => Promise.resolve(cb(defaultResponse))
    }))
    mockEq.mockImplementation(() => ({
        eq: mockEq,
        order: mockOrder,
        single: mockSingle,
        then: (cb: any) => Promise.resolve(cb(defaultResponse))
    }))
    mockSingle.mockImplementation(() => ({
        then: (cb: any) => Promise.resolve(cb({ data: null, error: null }))
    }))
    mockSelect.mockImplementation(() => ({
        order: mockOrder,
        eq: mockEq,
        single: mockSingle,
        then: (cb: any) => Promise.resolve(cb(defaultResponse))
    }))
  })

  it('debe obtener todos los pagos', async () => {
    const mockData = [{ id: '1', concepto: 'Mensualidad' }]
    mockEq.mockImplementation(() => ({
        then: (cb: any) => Promise.resolve(cb({ data: mockData, error: null }))
    }))
    
    const result = await pagoService.getAll()
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockData)
  })

  it('debe manejar errores en getAll', async () => {
    // Para que entre al catch con el mensaje correcto, lanzamos el error
    mockEq.mockImplementation(() => ({
        then: (cb: any) => Promise.resolve(cb({ data: null, error: new Error('Error DB') }))
    }))
    
    const result = await pagoService.getAll()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Error DB')
  })

  it('debe obtener pagos por judoka', async () => {
    const mockData = [{ id: '1', judoka_id: 'j1' }]
    mockOrder.mockImplementation(() => ({
        then: (cb: any) => Promise.resolve(cb({ data: mockData, error: null }))
    }))
    
    const result = await pagoService.getByJudoka('j1')
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockData)
  })

  it('debe obtener un pago por ID', async () => {
    const mockPago = { id: 'p1', monto_base: 100 }
    mockSingle.mockImplementation(() => ({
        then: (cb: any) => Promise.resolve(cb({ data: mockPago, error: null }))
    }))
    
    const result = await pagoService.getById('p1')
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockPago)
  })
})
