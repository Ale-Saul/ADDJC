import { judokaService } from '../judokaService'

const mockChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis()
}

jest.mock('../../lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => mockChain)
  }))
}))

jest.mock('../userService', () => ({
  userService: {
    createJudokaUser: jest.fn().mockResolvedValue({ success: true, data: { userId: 'u1', usuarioId: 'uu1' } })
  }
}))

describe('judokaService Final Coverage Push', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockChain.single.mockReset()
    mockChain.maybeSingle.mockReset()
    mockChain.order.mockReset()
    mockChain.eq.mockReturnThis()
  })

  it('getAll', async () => {
    mockChain.order.mockResolvedValue({ data: [{ id: 'j1', usuarios: { nombre: 'X' } }], error: null })
    const res = await judokaService.getAll()
    expect(res.success).toBe(true)
  })

  it('getById exitoso', async () => {
    mockChain.single.mockResolvedValue({ 
      data: { id: 'j1', usuarios: { nombre: 'X' }, clubes: { nombre_club: 'C' } }, 
      error: null 
    })
    const res = await judokaService.getById('j1')
    expect(res.success).toBe(true)
  })

  it('getById no encontrado', async () => {
    // Si data es null y error es null, el servicio asume �xito (pero el resultado es null)
    mockChain.single.mockResolvedValue({ data: null, error: null })
    const res = await judokaService.getById('j1')
    expect(res.success).toBe(true)
  })

  it('create exitoso', async () => {
    mockChain.single.mockResolvedValue({ data: { id: 'j1' }, error: null })
    const res = await judokaService.create({ 
       nombres: 'Juan', 
       apellido_paterno: 'Perez', 
       email: 'j@j.com',
       club_id: 'c1', 
       grado: 'Blanco' 
    } as any)
    expect(res.success).toBe(true)
  })

  it('create falla userService', async () => {
    const { userService } = require('../userService')
    userService.createJudokaUser.mockResolvedValueOnce({ success: false, error: 'Err' })
    const res = await judokaService.create({ nombres: 'X' } as any)
    expect(res.success).toBe(false)
  })

  it('create falla insert', async () => {
    mockChain.single.mockResolvedValue({ data: null, error: { message: 'DB Error' } })
    const res = await judokaService.create({ nombres: 'X' } as any)
    expect(res.success).toBe(false)
  })

  it('update exitoso', async () => {
    mockChain.single.mockResolvedValue({ data: { id: 'j1' }, error: null })
    const res = await judokaService.update('j1', { peso_competitivo: 70 })
    expect(res.success).toBe(true)
  })

  it('update falla insert', async () => {
    mockChain.single.mockResolvedValue({ data: null, error: { message: 'Err' } })
    const res = await judokaService.update('j1', {})
    expect(res.success).toBe(false)
  })

  it('delete exitoso', async () => {
    mockChain.single.mockResolvedValue({ data: { usuario_id: 'u1' }, error: null })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
    const res = await judokaService.delete('j1')
    expect(res.success).toBe(true)
  })

  it('delete falla fetch', async () => {
    mockChain.single.mockResolvedValue({ data: { usuario_id: 'u1' }, error: null })
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Err'))
    const res = await judokaService.delete('j1')
    expect(res.success).toBe(false)
  })

  it('restore con error delete', async () => {
     mockChain.single.mockResolvedValue({ data: { usuario_id: 'u1' }, error: { message: 'Err' } })
     const res = await judokaService.restore('j1')
     expect(res.success).toBe(false)
  })

  it('getByClub', async () => {
    mockChain.order.mockResolvedValue({ data: [{ id: 'j1' }], error: null })
    const res = await judokaService.getByClub('c1')
    expect(res.success).toBe(true)
  })

  it('getByClub error', async () => {
    mockChain.order.mockResolvedValue({ data: null, error: { message: 'Err' } })
    const res = await judokaService.getByClub('c1')
    expect(res.success).toBe(false)
  })
})
