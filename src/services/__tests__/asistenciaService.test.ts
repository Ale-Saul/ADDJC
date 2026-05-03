import { asistenciaService } from '../asistenciaService'
import { createClient } from '@/lib/supabase/client'

// --- Mock de Supabase ---
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

describe('Asistencia Service (Fase 1)', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: jest.fn()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  // ============================================================================
  // SESIONES
  // ============================================================================

  describe('getByClub', () => {
    it('debería retornar las sesiones de un club y mapear correctamente los nombres', async () => {
      const mockData = [
        {
          id: 'sesion-1',
          club_id: 'club-1',
          senseis: { usuarios: { nombre: 'Juan', apellido_paterno: 'Perez' } },
          clubes: { nombre_club: 'Judo Club' }
        }
      ]
      
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: mockData, error: null }))

      const res = await asistenciaService.getByClub('club-1')

      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      expect(res.data![0].nombre_sensei).toBe('Juan Perez')
      expect(res.data![0].nombre_club).toBe('Judo Club')
      expect(mockSupabase.from).toHaveBeenCalledWith('asistencia_sesiones')
      expect(mockSupabase.eq).toHaveBeenCalledWith('club_id', 'club-1')
    })

    it('debería manejar errores de Supabase', async () => {
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: null, error: new Error('DB Error') }))
      
      const res = await asistenciaService.getByClub('club-1')
      expect(res.success).toBe(false)
      expect(res.error).toBe('DB Error')
    })
  })

  describe('getBySensei', () => {
    it('debería retornar las sesiones de un sensei', async () => {
      const mockData = [
        { id: 'sesion-1', sensei_id: 'sensei-1' }
      ]
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: mockData, error: null }))

      const res = await asistenciaService.getBySensei('sensei-1')

      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(mockSupabase.eq).toHaveBeenCalledWith('sensei_id', 'sensei-1')
    })
  })

  describe('create', () => {
    it('debería crear una sesión exitosamente', async () => {
      const mockPayload = { club_id: 'club-1', sensei_id: 'sensei-1', fecha: '2026-04-28' }
      
      // Simula inserción exitosa devolviendo el ID
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: { id: 'new-id' }, error: null }))
      
      // Simula el getById llamado al final de create()
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ 
        data: { id: 'new-id', ...mockPayload }, 
        error: null 
      }))

      const res = await asistenciaService.create(mockPayload)

      expect(res.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(mockSupabase.select).toHaveBeenCalledWith('id')
    })

    it('debería manejar error de unicidad (23505)', async () => {
      const mockPayload = { club_id: 'club-1', sensei_id: 'sensei-1', fecha: '2026-04-28' }
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ 
        data: null, 
        error: { code: '23505', message: 'Unique violation' } 
      }))

      const res = await asistenciaService.create(mockPayload)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Ya existe una sesión registrada para este sensei')
    })
  })

  describe('update', () => {
    it('debería actualizar una sesión y retornarla', async () => {
      // Simula el update
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ error: null }))
      
      // Simula el getById llamado al final de update()
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ 
        data: { id: 'sesion-1', titulo: 'Clase Editada' }, 
        error: null 
      }))

      const res = await asistenciaService.update('sesion-1', { titulo: 'Clase Editada' })

      expect(res.success).toBe(true)
      expect(res.data?.titulo).toBe('Clase Editada')
      expect(mockSupabase.update).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('debería realizar un borrado lógico (desactivar)', async () => {
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ error: null }))

      const res = await asistenciaService.delete('sesion-1')

      expect(res.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ activo: false }))
    })
  })

  // ============================================================================
  // ASISTENCIA DETALLE
  // ============================================================================

  describe('getDetalleBySesion', () => {
    it('debería obtener la lista de asistencias', async () => {
      const mockData = [
        {
          id: 'detalle-1',
          estado: 'presente',
          judokas: { usuarios: { nombre: 'María', apellido_paterno: 'Lopez' } }
        }
      ]
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: mockData, error: null }))

      const res = await asistenciaService.getDetalleBySesion('sesion-1')

      expect(res.success).toBe(true)
      expect(res.data![0].nombre_judoka).toBe('María')
      expect(res.data![0].apellido_judoka).toBe('Lopez')
      expect(mockSupabase.from).toHaveBeenCalledWith('asistencia_detalle')
    })
  })

  describe('upsertAsistencias', () => {
    it('no debería llamar a supabase si el array de asistencias está vacío', async () => {
      const res = await asistenciaService.upsertAsistencias([])
      expect(res.success).toBe(true)
      expect(mockSupabase.upsert).not.toHaveBeenCalled()
    })

    it('debería hacer upsert de múltiples asistencias', async () => {
      const payload = [
        { sesion_id: 'sesion-1', judoka_id: 'judoka-1', estado: 'presente' as const },
        { sesion_id: 'sesion-1', judoka_id: 'judoka-2', estado: 'ausente' as const }
      ]
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ error: null }))

      const res = await asistenciaService.upsertAsistencias(payload)

      expect(res.success).toBe(true)
      expect(mockSupabase.upsert).toHaveBeenCalled()
      // Validar onConflict
      expect(mockSupabase.upsert.mock.calls[0][1]).toEqual({ onConflict: 'sesion_id, judoka_id' })
    })

    it('debería manejar errores de Supabase en upsert', async () => {
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ error: new Error('Upsert Fail') }))
      const res = await asistenciaService.upsertAsistencias([
        { sesion_id: 's', judoka_id: 'j', estado: 'presente' }
      ])
      expect(res.success).toBe(false)
      expect(res.error).toBe('Upsert Fail')
    })
  })

  describe('getHistorialByJudoka', () => {
    it('debería retornar el historial aplicando filtros de fecha gte y lte', async () => {
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'det-1', estado: 'presente' }], error: null }))

      const res = await asistenciaService.getHistorialByJudoka('judoka-1', '2026-01-01', '2026-12-31')

      expect(res.success).toBe(true)
      expect(mockSupabase.gte).toHaveBeenCalledWith('asistencia_sesiones.fecha', '2026-01-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('asistencia_sesiones.fecha', '2026-12-31')
    })
  })
})