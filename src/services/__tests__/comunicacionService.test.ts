import { comunicacionService } from '../comunicacionService'
import { createClient } from '@/lib/supabase/client'
import { ROL } from '@/constants/roles'

// Mock de Supabase con soporte para la Fluent API y Promises (.then)
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/img.jpg' } })
    })
  },
  then: jest.fn().mockImplementation(function(onSuccess) {
    const result = { data: [], error: null };
    return typeof onSuccess === 'function' 
      ? Promise.resolve(onSuccess(result)) 
      : Promise.resolve(result);
  })
}

const reapplyMocks = () => {
  jest.clearAllMocks()
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.or.mockReturnThis()
  mockSupabase.ilike.mockReturnThis()
  mockSupabase.is.mockReturnThis()
  mockSupabase.lte.mockReturnThis()
  mockSupabase.order.mockReturnThis()
  mockSupabase.limit.mockReturnThis()
  mockSupabase.maybeSingle.mockReturnThis()
  mockSupabase.single.mockReturnThis()
  mockSupabase.insert.mockReturnThis()
  mockSupabase.update.mockReturnThis()
  mockSupabase.delete.mockReturnThis()
  
  mockSupabase.then.mockImplementation(function(onSuccess) {
    const result = { data: [], error: null };
    return typeof onSuccess === 'function' 
      ? Promise.resolve(onSuccess(result)) 
      : Promise.resolve(result);
  })
}

const mockValueNext = (data: any, error: any = null) => {
  mockSupabase.then.mockImplementationOnce(function(onSuccess: any) {
    const result = { data, error }
    if (typeof onSuccess === 'function') {
      return Promise.resolve(onSuccess(result))
    }
    return Promise.resolve(result)
  })
}

const mockRejectNext = (error: any) => mockValueNext(null, error)
const mockThrowNext = (error: any) => mockValueNext(null, error)

const mockValuesNext = (results: {data: any, error: any}[]) => {
  mockSupabase.then.mockImplementation(function(onSuccess: any) {
    const res = results.shift() || { data: [], error: null };
    if (typeof onSuccess === 'function') {
      return Promise.resolve(onSuccess(res))
    }
    return Promise.resolve(res)
  })
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

describe('comunicacionService - Fase 1: Mapeo y Utilidades', () => {
  beforeEach(() => {
    reapplyMocks()
  })

  describe('Utilidades de Mapeo de Nombres', () => {
    it('getNombreCompleto: debe manejar nombres y apellidos completos', async () => {
      // Usamos getDestinatarioActivoById que internamente llama a mapDestinatarioUsuario -> getNombreCompleto
      mockValueNext({
        id: '1',
        nombre: 'Juan',
        apellido_paterno: 'Perez',
        apellido_materno: 'Sosa',
        correo: 'juan@test.com',
        rol: ROL.JUDOKA
      })
      const res = await comunicacionService.getDestinatarioActivoById('1')
      expect(res?.nombre_completo).toBe('Juan Perez Sosa')
    })

    it('getNombreCompleto: debe usar el correo si no hay nombre', async () => {
      mockValueNext({
        id: '1',
        correo: 'juan@test.com',
        rol: ROL.JUDOKA
      })
      const res = await comunicacionService.getDestinatarioActivoById('1')
      expect(res?.nombre_completo).toBe('juan@test.com')
    })

    it('getNombreCompleto: fallback final si no hay nada', async () => {
      mockValueNext({
        id: '1',
        rol: ROL.JUDOKA
      })
      const res = await comunicacionService.getDestinatarioActivoById('1')
      expect(res?.nombre_completo).toBe('Usuario sin nombre')
    })
  })

  describe('Mapeo de Filas (Record transformation)', () => {
    it('mapNoticiaRow: debe manejar objetos de unión correctamente', async () => {
      mockValueNext({
        id: '1',
        titulo: 'Noticia Test',
        created_at: '2023-01-01T10:00:00Z',
        usuarios: { nombre: 'Juan', apellido_paterno: 'Perez' }, // Mapeado por mapNoticiaRow
        clubes: { nombre_club: 'Mi Club' }
      })
      const res = await comunicacionService.getNoticiaById('1')
      expect(res?.nombre_autor).toBe('Juan Perez')
      expect(res?.nombre_club).toBe('Mi Club')
    })

    it('mapNoticiaRow: debe manejar arrays de unión (caso raro de Supabase)', async () => {
      // Mock de datos para getDestinatariosByClub que usa getSingleJoin
      const mockClubRow = {
        club_id: 'c1',
        usuarios: [{ id: 'u1', nombre: 'Juan', correo: 'j@t.com', rol: ROL.JUDOKA, activo: true }],
        clubes: [{ nombre_club: 'Club Alpha' }]
      }
      mockValuesNext([{ data: [mockClubRow], error: null }, { data: [], error: null }])

      const res = await comunicacionService.getDestinatariosByClub('c1')
      expect(res[0].nombre_completo).toBe('Juan')
      expect(res[0].club_nombre).toBe('Club Alpha')
    })
  })

  describe('Utilidades de Texto y Búsqueda', () => {
    it('normalizeSearchTerm: debe limpiar caracteres especiales (%, (), etc.)', async () => {
      mockValueNext([])
      await comunicacionService.getDestinatariosParaAsociacion('Juan% (Perez)')
      // ilike construye algo como: `nombre.ilike.%Juan Perez%,...`
      expect(mockSupabase.or).toHaveBeenCalledWith(expect.stringContaining('Juan Perez'))
    })

    it('filterDestinatariosBySearch: debe filtrar por email, rol y club en memoria', async () => {
      const mockResult = {
        data: [
          { 
            club_id: 'c1',
            usuarios: { id: 'u1', nombre: 'Juan', correo: 'juan@test.com', rol: ROL.JUDOKA, activo: true },
            clubes: { nombre_club: 'Club Alpha' }
          },
          { 
            club_id: 'c1',
            usuarios: { id: 'u2', nombre: 'Pedro', correo: 'pedro@test.com', rol: ROL.SENSEI, activo: true },
            clubes: { nombre_club: 'Club Beta' }
          }
        ],
        error: null
      }
      reapplyMocks()
      mockValuesNext([mockResult, { data: [], error: null }])

      // Buscamos por ROL
      const resRol = await comunicacionService.getDestinatariosByClub('c1', 'sensei')
      expect(resRol.length).toBe(1)
      expect(resRol[0].id).toBe('u2')

      // Buscamos por CLUB
      reapplyMocks()
      mockValuesNext([mockResult, { data: [], error: null }])
      const resClub = await comunicacionService.getDestinatariosByClub('c1', 'Alpha')
      expect(resClub.length).toBe(1)
      expect(resClub[0].id).toBe('u1')
    })
  })

  describe('Noticias - Filtros de Administración', () => {
    it('getNoticiasByClub: debe traer solo noticias del club para administración (solo_activas: false)', async () => {
      mockValueNext([])
      await comunicacionService.getNoticiasByClub('club-admin', { solo_activas: false })
      expect(mockSupabase.eq).toHaveBeenCalledWith('club_id', 'club-admin')
      expect(mockSupabase.or).not.toHaveBeenCalled()
    })
  })

  describe('Notificaciones - Alta Prioridad', () => {
    it('getContadorNoLeidas: debe identificar si hay alguna de alta prioridad', async () => {
      mockValueNext([
        { id: '1', prioridad: 'normal' },
        { id: '2', prioridad: 'alta' }
      ])
      const res = await comunicacionService.getContadorNoLeidas('u1')
      expect(res.total_no_leidas).toBe(2)
      expect(res.tiene_alta_prioridad).toBe(true)
    })
  })

  describe('Fase 2: Filtros de Negocio y Casos de Borde', () => {
    describe('Filtros de Audiencia en Noticias', () => {
      it('getNoticiasByClub: debe filtrar para audiencia "judokas" incluyendo "todos"', async () => {
        mockValueNext([])
        await comunicacionService.getNoticiasByClub('club1', { audiencia: 'judokas' })
        // Debería generar un OR con judokas y todos
        expect(mockSupabase.or).toHaveBeenCalledWith(expect.stringContaining('audiencia.cs.{judokas}'))
        expect(mockSupabase.or).toHaveBeenCalledWith(expect.stringContaining('audiencia.cs.{todos}'))
      })

      it('getNoticiasByClub: debe combinar "senseis" y "encargados" para el rol sensei', async () => {
        mockValueNext([])
        await comunicacionService.getNoticiasByClub('club1', { audiencia: 'senseis' })
        const lastOrCall = mockSupabase.or.mock.calls.find(call => call[0].includes('senseis'))
        expect(lastOrCall[0]).toContain('audiencia.cs.{senseis}')
        expect(lastOrCall[0]).toContain('audiencia.cs.{encargados}')
        expect(lastOrCall[0]).toContain('audiencia.cs.{todos}')
      })

      it('getNoticiasByClub: debe filtrar por fecha_referencia correctamente', async () => {
        mockValueNext([])
        const hoy = '2023-05-01'
        await comunicacionService.getNoticiasByClub('club1', { fecha_referencia: hoy })
        
        expect(mockSupabase.lte).toHaveBeenCalledWith('fecha_inicio', hoy)
        // El OR de fecha_fin
        expect(mockSupabase.or).toHaveBeenCalledWith(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)
      })
    })

    describe('Noticias Destacadas', () => {
      it('getNoticiasDestacadas: debe aplicar filtros de fecha y activo por defecto', async () => {
        mockValueNext([])
        await comunicacionService.getNoticiasDestacadas('club1', 'judokas')
        
        expect(mockSupabase.eq).toHaveBeenCalledWith('activo', true)
        expect(mockSupabase.eq).toHaveBeenCalledWith('es_destacada', true)
        expect(mockSupabase.lte).toHaveBeenCalledWith('fecha_inicio', expect.any(String))
      })
    })

    describe('Manejo de Errores Específicos', () => {
      it('getNoticiaById: debe retornar null si el código es PGRST116 (No encontrado)', async () => {
        mockRejectNext({ code: 'PGRST116', message: 'Not found' })
        const res = await comunicacionService.getNoticiaById('999')
        expect(res).toBeNull()
      })

      it('getNoticiaById: debe lanzar error si la data es null y no es 406', async () => {
        reapplyMocks()
        mockValueNext(null, { code: '500', message: 'Fatal' })
        try {
          await comunicacionService.getNoticiaById('1')
          fail('Should have thrown')
        } catch (e: any) {
          expect(e.code).toBe('500')
        }
      })

      it('createNotificacion: debe lanzar error si falla (no es duplicado)', async () => {
        mockThrowNext({ code: '500', message: 'DB Error' })
        await expect(comunicacionService.createNotificacion({ 
          usuario_id: 'u1', titulo: 'T', mensaje: 'M', prioridad: 'normal', tipo: 'sistema' 
        })).rejects.toMatchObject({ code: '500' })
      })
    })

    describe('Storage - Carga de Imágenes', () => {
      it('uploadImagenNoticia: debe subir archivo y retornar URL pública', async () => {
        const mockFile = new File([''], 'test.png', { type: 'image/png' })
        const res = await comunicacionService.uploadImagenNoticia(mockFile)
        
        expect(res).toBe('https://test.com/img.jpg')
        expect(mockSupabase.storage.from).toHaveBeenCalledWith('noticias-imagenes')
      })

      it('uploadImagenNoticia: debe lanzar error si falla la subida debido a error en objeto de retorno', async () => {
        // Redefinimos el mock de storage para que retorne un error en el objeto (no un rejection)
        mockSupabase.storage.from = jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: { message: 'Storage Error' } }),
          getPublicUrl: jest.fn()
        })
        
        const mockFile = new File([''], 'test.png', { type: 'image/png' })
        await expect(comunicacionService.uploadImagenNoticia(mockFile)).rejects.toMatchObject({ message: 'Storage Error' })
        
        // Restauramos el mock original para otros tests
        mockSupabase.storage.from = jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/img.jpg' } })
        })
      })
    })
  })

  describe('Fase 3: Integración de Destinatarios y Robustez', () => {
    describe('Búsqueda Global (Para Asociación)', () => {
      it('getDestinatariosParaAsociacion: debe concatenar múltiples filtros ilike si el término es largo', async () => {
        mockValueNext([])
        await comunicacionService.getDestinatariosParaAsociacion('Juan')
        
        // El or debe contener nombre, apellido_paterno, apellido_materno y correo
        expect(mockSupabase.or).toHaveBeenCalledWith(expect.stringContaining('nombre.ilike.%Juan%'))
        expect(mockSupabase.or).toHaveBeenCalledWith(expect.stringContaining('correo.ilike.%Juan%'))
      })

      it('getDestinatariosParaAsociacion: no debe filtrar por término si es muy corto', async () => {
        mockValueNext([])
        await comunicacionService.getDestinatariosParaAsociacion('a')
        expect(mockSupabase.or).not.toHaveBeenCalled()
      })
    })

    describe('Búsqueda por Club (Lógica de Unión)', () => {
      it('getDestinatariosByClub: debe combinar judokas y senseis eliminando duplicados por ID de usuario', async () => {
        const usuarioComun = { id: 'u1', nombre: 'Mix', correo: 'm@t.com', rol: ROL.SENSEI, activo: true }
        
        const mockJudokas = { data: [{ club_id: 'c1', usuarios: [usuarioComun], clubes: { nombre_club: 'C1' } }], error: null }
        const mockSenseis = { data: [{ club_id: 'c1', usuarios: usuarioComun, clubes: [{ nombre_club: 'C1' }] }], error: null }
        
        reapplyMocks()
        mockValueNext(mockJudokas.data)
        mockValueNext(mockSenseis.data)

        const res = await comunicacionService.getDestinatariosByClub('c1')
        expect(res.length).toBe(1)
        expect(res[0].id).toBe('u1')
      })

      it('getDestinatariosByClub: debe excluir roles restringidos (ASOCIACION, ADMIN)', async () => {
        const usuarioAdmin = { id: 'u2', nombre: 'Admin', rol: ROL.ADMIN, activo: true }
        
        reapplyMocks()
        mockValueNext([{ club_id: 'c1', usuarios: usuarioAdmin }])
        mockValueNext([])

        const res = await comunicacionService.getDestinatariosByClub('c1')
        expect(res.length).toBe(0)
      })

      it('getDestinatariosByClub: debe lanzar error si falla la consulta de judokas', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'DB Error Judokas' })
        
        try {
          await comunicacionService.getDestinatariosByClub('c1')
          fail('Should have thrown')
        } catch (e: any) {
          expect(e.message).toBe('DB Error Judokas')
        }
      })
    })

    describe('Utilidades de Estado y Pertenencia', () => {
      it('usuarioPerteneceAClub: debe retornar true si es judoka del club', async () => {
        reapplyMocks()
        // Secuencial: Judoka ok, Sensei vacio
        mockValueNext([{ id: 'j1' }])
        mockValueNext([])
        const res = await comunicacionService.usuarioPerteneceAClub('u1', 'c1')
        expect(res).toBe(true)
      })

      it('usuarioPerteneceAClub: debe retornar true si es sensei del club', async () => {
        reapplyMocks()
        // Secuencial: Judoka vacio, Sensei ok
        mockValueNext([])
        mockValueNext([{ id: 's1' }])
        const res = await comunicacionService.usuarioPerteneceAClub('u1', 'c1')
        expect(res).toBe(true)
      })

      it('usuarioPerteneceAClub: debe lanzar error si falla la consulta', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'Query Fail' })
        try {
          await comunicacionService.usuarioPerteneceAClub('u1', 'c1')
          fail('Should have thrown')
        } catch (e: any) {
          expect(e.message).toBe('Query Fail')
        }
      })
    })

    describe('Marcar como Leídas', () => {
      it('marcarTodasLeidas: debe ejecutar update masivo correctamente', async () => {
        reapplyMocks()
        mockValueNext([])
        await comunicacionService.marcarTodasLeidas('u1')
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ leido: true }))
        expect(mockSupabase.eq).toHaveBeenCalledWith('usuario_id', 'u1')
      })

      it('marcarTodasLeidas: debe lanzar error si falla el update', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'Update error' })
        try {
          await comunicacionService.marcarTodasLeidas('u1')
          fail('Should have thrown')
        } catch (e: any) {
          expect(e.message).toBe('Update error')
        }
      })
    })

    describe('Casos de Borde Adicionales', () => {
      it('marcarComoLeida: debe actualizar el estado correctamente', async () => {
        reapplyMocks()
        mockValueNext([])
        await comunicacionService.marcarComoLeida('notif-1')
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ leido: true }))
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'notif-1')
      })

      it('existeNotificacionOrigen: debe detectar si ya existe', async () => {
        reapplyMocks()
        mockValueNext([{ id: 'n1' }])
        const res = await comunicacionService.existeNotificacionOrigen('u1', 'o1', 'modulo')
        expect(res).toBe(true)
      })

      it('existeNotificacionOrigen: debe retornar false si falla consulta', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'Fail silent' })
        const res = await comunicacionService.existeNotificacionOrigen('u1', 'o1', 'modulo')
        expect(res).toBe(false)
      })

      it('getNotificacionByOrigen: debe traer la primera coincidencia', async () => {
        reapplyMocks()
        mockValueNext({ id: 'n1', titulo: 'Test' })
        const res = await comunicacionService.getNotificacionByOrigen('u1', 'o1', 'modulo')
        expect(res?.titulo).toBe('Test')
      })

      it('getNotificacionByOrigen: debe retornar null si no hay resultados', async () => {
        reapplyMocks()
        mockValueNext(null, null) 
        const res = await comunicacionService.getNotificacionByOrigen('u1', 'o1', 'modulo')
        expect(res).toBeNull()
      })

      it('getNotificacionByOrigen: debe lanzar error si falla query', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'Fatal' })
        try {
          await comunicacionService.getNotificacionByOrigen('u1', 'o1', 'modulo')
          fail('Should throw')
        } catch (e: any) {
          expect(e.message).toBe('Fatal')
        }
      })
    })

    describe('Funciones de Notificaciones Específicas', () => {
      it('getNotificacionesByUsuario: debe traer notificaciones del usuario ordenadas', async () => {
        reapplyMocks()
        mockValueNext([{ id: 'n1', titulo: 'T1' }])
        const res = await comunicacionService.getNotificacionesByUsuario('u1')
        expect(res.length).toBe(1)
        expect(mockSupabase.eq).toHaveBeenCalledWith('usuario_id', 'u1')
        expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      })

      it('marcarTodasLeidas: debe marcar todas como leídas para un usuario', async () => {
        reapplyMocks()
        mockValueNext([])
        await comunicacionService.marcarTodasLeidas('u1')
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ leido: true }))
        expect(mockSupabase.eq).toHaveBeenCalledWith('usuario_id', 'u1')
      })
    })

    describe('Casos de Error Restantes', () => {
      it('getNoticiasByClub: debe lanzar error en caso de fallo de DB', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'DB Fail' })
        try {
          await comunicacionService.getNoticiasByClub('c1')
          fail('Should throw')
        } catch (e: any) {
          expect(e.message).toBe('DB Fail')
        }
      })

      it('getNotificacionesByUsuario: debe lanzar error en caso de fallo de DB', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'DB Fail' })
        try {
          await comunicacionService.getNotificacionesByUsuario('u1')
          fail('Should throw')
        } catch (e: any) {
          expect(e.message).toBe('DB Fail')
        }
      })

      it('marcarComoLeida: debe lanzar error en caso de fallo de DB', async () => {
        reapplyMocks()
        mockValueNext(null, { message: 'DB Fail' })
        try {
          await comunicacionService.marcarComoLeida('n1')
          fail('Should throw')
        } catch (e: any) {
          expect(e.message).toBe('DB Fail')
        }
      })

      it('getNoticiaById: debe manejar correctamente el caso de audiencia null o vacía', async () => {
        reapplyMocks()
        mockValueNext({ 
          id: 'n1', 
          titulo: 'Test', 
          audiencia: null 
        })
        const res = await comunicacionService.getNoticiaById('n1')
        // El mapper actual devuelve la data como viene si es null
        expect(res?.audiencia).toBeNull() 
      })
    })
  })
})
