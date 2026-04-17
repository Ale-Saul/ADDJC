import { clubService } from '../clubService'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('clubService', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('getAll', () => {
    it('debe obtener todos los clubes activos', async () => {
      const mockData = [{ id: '1', nombre_club: 'Club A', activo: true, director_tecnico: null }]
      mockSupabase.then.mockImplementation((callback) => 
        Promise.resolve(callback({ data: mockData, error: null }))
      )

      const result = await clubService.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('debe orquestar roles si se asigna un director t�cnico al crear', async () => {
      const clubWithDT = { nombre_club: 'Club DT', director_tecnico_id: 'dt-1' }
      const mockCreated = { id: '3', ...clubWithDT }

      mockSupabase.then
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: mockCreated, error: null }))) // insert
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: { usuario_id: 'u-1' }, error: null }))) // select sensei
        .mockImplementationOnce((callback) => Promise.resolve(callback({ error: null }))) // update usuario
        .mockImplementationOnce((callback) => Promise.resolve(callback({ error: null }))) // update sensei
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: { ...mockCreated, director_tecnico: null }, error: null }))) // getById

      const result = await clubService.create(clubWithDT as any)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.from).toHaveBeenCalledWith('senseis')
    })
  })

  describe('update', () => {
    it('debe actualizar un club y manejar cambio de director', async () => {
      const updateData = { director_tecnico_id: 'dt-new' }
      const mockUpdated = { id: '1', director_tecnico_id: 'dt-new' }

      mockSupabase.then
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: { director_tecnico_id: 'dt-old' }, error: null }))) // select anterior
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: { usuario_id: 'u-old' }, error: null }))) // select sensei anterior
        .mockImplementationOnce((callback) => Promise.resolve(callback({ error: null }))) // update usuario anterior
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: { usuario_id: 'u-new' }, error: null }))) // select sensei nuevo
        .mockImplementationOnce((callback) => Promise.resolve(callback({ error: null }))) // update usuario nuevo
        .mockImplementationOnce((callback) => Promise.resolve(callback({ error: null }))) // update sensei nuevo
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: mockUpdated, error: null }))) // update club
        .mockImplementationOnce((callback) => Promise.resolve(callback({ data: { ...mockUpdated, director_tecnico: null }, error: null }))) // getById

      const result = await clubService.update('1', updateData as any)

      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ rol: 'sensei' }))
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ rol: 'encargado' }))
    })
  })

  describe('restore', () => {
    it('debe marcar un club como activo', async () => {
      mockSupabase.then.mockImplementationOnce((callback) => 
        Promise.resolve(callback({ data: { id: '1', activo: true }, error: null }))
      )
      const result = await clubService.restore('1')
      expect(result.success).toBe(true)
      expect(result.data?.activo).toBe(true)
    })
  })

  describe('documentos', () => {
    it('debe agregar un documento', async () => {
      const doc = { id: 'd1', nombre_documento: 'doc' }
      mockSupabase.then.mockImplementationOnce((callback) => 
        Promise.resolve(callback({ data: doc, error: null }))
      )
      const result = await clubService.addDocument('1', 'doc', 'url', 'pdf', 'u1')
      expect(result.success).toBe(true)
      expect(result.data?.nombre_documento).toBe('doc')
    })

    it('debe eliminar un documento', async () => {
      mockSupabase.then.mockImplementationOnce((callback) => 
        Promise.resolve(callback({ error: null }))
      )
      const result = await clubService.deleteDocument('d1')
      expect(result.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('debe eliminar un club', async () => {
      mockSupabase.then.mockImplementationOnce((callback) => 
        Promise.resolve(callback({ error: null }))
      )
      const result = await clubService.delete('1')
      expect(result.success).toBe(true)
    })
  })

  describe('getById', () => {
    it('debe obtener un club y mapear director técnico', async () => {
      const mockClub = { 
        id: '1', 
        nombre_club: 'Club A', 
        director_tecnico: { 
          id: 'dt-1', 
          usuarios: { nombre: 'Juan', apellido_paterno: 'Perez' } 
        } 
      }
      mockSupabase.then.mockImplementationOnce((callback) => 
        Promise.resolve(callback({ data: mockClub, error: null }))
      )

      const result = await clubService.getById('1')

      expect(result.success).toBe(true)
      expect(result.data?.director_tecnico?.nombres).toBe('Juan')
    })

    it('debe manejar error si el club no existe', async () => {
      mockSupabase.then.mockImplementationOnce((callback) => 
        Promise.resolve(callback({ data: null, error: new Error('No encontrado') }))
      )

      const result = await clubService.getById('999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No encontrado')
    })
  })
})
