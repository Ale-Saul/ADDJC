import { pagoService } from '../pagoService'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('pagoService - Cobertura Final', () => {
  const mockFrom = jest.fn()
  
  const createQueryMock = (data: any = [], error: any = null) => {
    const mock: any = {
      select: jest.fn(() => mock),
      insert: jest.fn(() => mock),
      update: jest.fn(() => mock),
      delete: jest.fn(() => mock),
      eq: jest.fn(() => mock),
      neq: jest.fn(() => mock),
      gt: jest.fn(() => mock),
      lt: jest.fn(() => mock),
      order: jest.fn(() => mock),
      single: jest.fn(() => mock),
      maybeSingle: jest.fn(() => mock),
      then: jest.fn((cb) => Promise.resolve(cb({ data, error })))
    }
    return mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue({ from: mockFrom })
  })

  it('getAll: debe manejar éxito y error', async () => {
    mockFrom.mockReturnValue(createQueryMock([{ id: '1' }]))
    let res = await pagoService.getAll()
    expect(res.success).toBe(true)

    mockFrom.mockReturnValue(createQueryMock(null, { message: 'Error' }))
    res = await pagoService.getAll()
    expect(res.success).toBe(false)
  })

  it('getByJudoka: debe manejar éxito', async () => {
    mockFrom.mockReturnValue(createQueryMock([{ id: '1' }]))
    const res = await pagoService.getByJudoka('j1')
    expect(res.success).toBe(true)
  })

  it('getByClub: debe manejar éxito y error', async () => {
    mockFrom.mockReturnValue(createQueryMock([{ id: '1' }]))
    let res = await pagoService.getByClub('c1')
    expect(res.success).toBe(true)

    mockFrom.mockReturnValue(createQueryMock(null, { message: 'DB Error' }))
    res = await pagoService.getByClub('c1')
    expect(res.success).toBe(false)
    // El servicio devuelve 'Error desconocido' si el error de Supabase no tiene el formato esperado por el catch general
    expect(res.error).toBeDefined()
  })

  it('getById: debe manejar éxito', async () => {
    mockFrom.mockReturnValue(createQueryMock({ id: '1' }))
    const res = await pagoService.getById('1')
    expect(res.success).toBe(true)
  })

  it('create: debe manejar errores específicos de Postgres', async () => {
    mockFrom.mockReturnValue(createQueryMock(null, { message: 'violates foreign key constraint "judoka_id"' }))
    let res = await pagoService.create({} as any)
    expect(res.error).toContain('El judoka no existe')

    mockFrom.mockReturnValue(createQueryMock(null, { message: 'violates foreign key constraint "club_id"' }))
    res = await pagoService.create({} as any)
    expect(res.error).toContain('El club no existe')

    mockFrom.mockReturnValue(createQueryMock(null, { message: 'violates foreign key constraint "creador_id"' }))
    res = await pagoService.create({} as any)
    expect(res.error).toContain('El usuario creador no existe')

    mockFrom.mockReturnValue(createQueryMock(null, { message: 'violates check constraint' }))
    res = await pagoService.create({} as any)
    expect(res.error).toContain('Verifica los montos y descuentos')
  })

  it('update, delete, restore: debe funcionar correctamente', async () => {
    mockFrom.mockReturnValue(createQueryMock({ id: '1' }))
    let res = await pagoService.update('1', {})
    expect(res.success).toBe(true)

    mockFrom.mockReturnValue(createQueryMock(null, null))
    let delRes = await pagoService.delete('1')
    expect(delRes.success).toBe(true)

    mockFrom.mockReturnValue(createQueryMock({ id: '1', activo: true }))
    let restRes = await pagoService.restore('1')
    expect(restRes.success).toBe(true)
  })

  it('catch blocks: debe capturar errores inesperados', async () => {
    mockFrom.mockImplementation(() => { throw new Error('Global Crash') })
    const res = await pagoService.getAll()
    expect(res.success).toBe(false)
    expect(res.error).toBe('Global Crash')
  })
})
