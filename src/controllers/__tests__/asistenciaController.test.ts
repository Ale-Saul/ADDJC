import { asistenciaController } from '../asistenciaController'
import { asistenciaService } from '@/services/asistenciaService'

// --- Mock del Servicio ---
jest.mock('@/services/asistenciaService', () => ({
  asistenciaService: {
    getByClub: jest.fn(),
    getBySensei: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getDetalleBySesion: jest.fn(),
    upsertAsistencias: jest.fn(),
    getHistorialByJudoka: jest.fn()
  }
}))

describe('Asistencia Controller (Fase 2)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  // ============================================================================
  // GET SESIONES BY CLUB / SENSEI
  // ============================================================================

  describe('getSesionesByClub', () => {
    it('debería retornar error si no se envía clubId', async () => {
      const res = await asistenciaController.getSesionesByClub('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('El ID del club es requerido')
    })

    it('debería calcular los contadores de presentes y total por sesión', async () => {
      // Mock getByClub
      const mockSesiones = [{ id: 'sesion-1', club_id: 'club-1' } as any]
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ success: true, data: mockSesiones })
      
      // Mock getDetalleBySesion (se llama internamente)
      const mockDetalle = [
        { id: 'd1', estado: 'presente' },
        { id: 'd2', estado: 'ausente' }
      ]
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({ success: true, data: mockDetalle })

      const res = await asistenciaController.getSesionesByClub('club-1')

      expect(res.success).toBe(true)
      expect(res.data![0].total_presentes).toBe(1) // 1 presente
      expect(res.data![0].total_judokas).toBe(2) // 2 en total
    })

    it('debería pasar el error del servicio si falla getByClub', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ success: false, error: 'DB Error' })
      const res = await asistenciaController.getSesionesByClub('club-1')
      expect(res.success).toBe(false)
    })
  })

  describe('getSesionesBySensei', () => {
    it('debería retornar error si no se envía senseiId', async () => {
      const res = await asistenciaController.getSesionesBySensei('')
      expect(res.success).toBe(false)
    })

    it('debería calcular contadores exitosamente', async () => {
      ;(asistenciaService.getBySensei as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ id: 's2' }] 
      })
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ estado: 'presente' }, { estado: 'presente' }] 
      })

      const res = await asistenciaController.getSesionesBySensei('sensei-abc')
      expect(res.success).toBe(true)
      expect(res.data![0].total_presentes).toBe(2)
      expect(res.data![0].total_judokas).toBe(2)
    })
  })

  // ============================================================================
  // GET SESION BY ID
  // ============================================================================
  
  describe('getSesionById', () => {
    it('retorna error si id es vacío', async () => {
      const res = await asistenciaController.getSesionById('')
      expect(res.success).toBe(false)
    })

    it('debería invocar getById', async () => {
      ;(asistenciaService.getById as jest.Mock).mockResolvedValueOnce({ success: true, data: { id: '1' } })
      const res = await asistenciaController.getSesionById('1')
      expect(res.success).toBe(true)
    })
  })

  // ============================================================================
  // CREATE / UPDATE / DELETE
  // ============================================================================

  describe('createSesion', () => {
    it('debería fallar si los datos no pasan el esquema zood (fecha requerida)', async () => {
      const payload: any = { club_id: 'c1', sensei_id: 's1' } // falta fecha
      const res = await asistenciaController.createSesion(payload)
      expect(res.success).toBe(false)
      expect(asistenciaService.create).not.toHaveBeenCalled()
    })

    it('debería mandar datos al servicio si son válidos', async () => {
      const payload: any = { club_id: 'e92b8d00-4b71-4a4b-b230-0536c31a7422', sensei_id: 'f83e5898-1b2c-473d-a517-5789f2130e5f', fecha: '2026-08-01' }
      ;(asistenciaService.create as jest.Mock).mockResolvedValueOnce({ success: true, data: payload })

      const res = await asistenciaController.createSesion(payload)
      if (!res.success) console.log('ERROR createSesion:', res.error)
      expect(res.success).toBe(true)
      expect(asistenciaService.create).toHaveBeenCalledWith(payload)
    })
  })

  describe('updateSesion', () => {
    it('debería fallar sin ID', async () => {
      const res = await asistenciaController.updateSesion('', {})
      expect(res.success).toBe(false)
    })

    it('debería fallar en Schema de actualización si hay campos inválidos', async () => {
      const payload: any = { titulo: 123 } // titulo debería ser string
      const res = await asistenciaController.updateSesion('1', payload)
      expect(res.success).toBe(false)
      expect(asistenciaService.update).not.toHaveBeenCalled()
    })

    it('debería invocar update() del servicio con payload limpio', async () => {
      ;(asistenciaService.update as jest.Mock).mockResolvedValueOnce({ success: true })
      const res = await asistenciaController.updateSesion('1', { titulo: 'Nuevo', notas: 'Notas' })
      expect(res.success).toBe(true)
      expect(asistenciaService.update).toHaveBeenCalledWith('1', { titulo: 'Nuevo', notas: 'Notas' })
    })
  })

  describe('deleteSesion', () => {
    it('debería fallar sin ID', async () => {
      const res = await asistenciaController.deleteSesion('')
      expect(res.success).toBe(false)
    })

    it('invoca delete del servicio', async () => {
      ;(asistenciaService.delete as jest.Mock).mockResolvedValueOnce({ success: true })
      const res = await asistenciaController.deleteSesion('id123', 'adminId')
      expect(res.success).toBe(true)
      expect(asistenciaService.delete).toHaveBeenCalledWith('id123', 'adminId')
    })
  })

  // ============================================================================
  // ASISTENCIA MASIVA & DETALLES
  // ============================================================================

  describe('registrarAsistenciaMasiva', () => {
    it('debería fallar sin sesion_id', async () => {
      const res = await asistenciaController.registrarAsistenciaMasiva('', [])
      expect(res.success).toBe(false)
    })

    it('debería fallar verificación zod si el payload tiene formatos erróneos', async () => {
      const res = await asistenciaController.registrarAsistenciaMasiva('e92b8d00-4b71-4a4b-b230-0536c31a7422', [
        { judoka_id: 'f83e5898-1b2c-473d-a517-5789f2130e5f', estado: 'invalido' as any }
      ])
      expect(res.success).toBe(false)
    })

    it('invoca upsertAsistencias si todo es válido', async () => {
      ;(asistenciaService.upsertAsistencias as jest.Mock).mockResolvedValueOnce({ success: true })
      const asistencias: any = [{ sesion_id: 'e92b8d00-4b71-4a4b-b230-0536c31a7422', judoka_id: 'f83e5898-1b2c-473d-a517-5789f2130e5f', estado: 'presente' }]
      
      const res = await asistenciaController.registrarAsistenciaMasiva('e92b8d00-4b71-4a4b-b230-0536c31a7422', asistencias)
      if (!res.success) console.log('ERROR registrarAsistenciaMasiva:', res.error)
      expect(res.success).toBe(true)
      expect(asistenciaService.upsertAsistencias).toHaveBeenCalledWith(asistencias)
    })
  })

  // ============================================================================
  // HISTORIAL Y ESTADÍSTICAS
  // ============================================================================

  describe('getHistorialJudoka', () => {
    it('falla sin judoka_id', async () => {
      const res = await asistenciaController.getHistorialJudoka('')
      expect(res.success).toBe(false)
    })

    it('invoca getHistorialByJudoka con o sin filtros', async () => {
      ;(asistenciaService.getHistorialByJudoka as jest.Mock).mockResolvedValueOnce({ success: true, data: [] })
      const res = await asistenciaController.getHistorialJudoka('e92b8d00-4b71-4a4b-b230-0536c31a7422', { fecha_inicio: '2026-01-01' })
      if (!res.success) console.log('ERROR getHistorialJudoka:', res.error)
      expect(res.success).toBe(true)
      expect(asistenciaService.getHistorialByJudoka).toHaveBeenCalledWith('e92b8d00-4b71-4a4b-b230-0536c31a7422', '2026-01-01', undefined)
    })
  })

  describe('getStatsJudoka', () => {
    it('calcula correctamente presentes, ausentes y %', async () => {
      ;(asistenciaService.getHistorialByJudoka as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [{ estado: 'presente' }, { estado: 'ausente' }, { estado: 'presente' }]
      })

      const res = await asistenciaController.getStatsJudoka('e92b8d00-4b71-4a4b-b230-0536c31a7422')
      expect(res.success).toBe(true)
      expect(res.data?.total_sesiones).toBe(3)
      expect(res.data?.presentes).toBe(2)
      expect(res.data?.ausentes).toBe(1)
      expect(res.data?.porcentaje).toBe(66.67) // 2/3 * 100
    })

    it('devuelve % 0 si no hay sesiones', async () => {
      ;(asistenciaService.getHistorialByJudoka as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: []
      })

      const res = await asistenciaController.getStatsJudoka('e92b8d00-4b71-4a4b-b230-0536c31a7422')
      expect(res.data?.porcentaje).toBe(0)
    })
  })

  describe('getStatsBySensei', () => {
    it('falla sin senseiId', async () => {
      const res = await asistenciaController.getStatsBySensei('')
      expect(res.success).toBe(false)
    })

    it('devuelve array vacío si el sensei no tiene sesiones', async () => {
      ;(asistenciaService.getBySensei as jest.Mock).mockResolvedValueOnce({ success: true, data: [] })
      const res = await asistenciaController.getStatsBySensei('s1')
      expect(res.success).toBe(true)
      expect(res.data).toEqual([])
    })

    it('filtra sesiones por fecha y calcula stats agregadas por judoka', async () => {
      ;(asistenciaService.getBySensei as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ id: 'sesion1', fecha: '2026-05-01' }] 
      })
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          { judoka_id: 'j1', nombre_judoka: 'A', apellido_judoka: 'B', estado: 'presente' },
          { judoka_id: 'j1', nombre_judoka: 'A', apellido_judoka: 'B', estado: 'ausente' } // simulando que es del array anterior pero para la lógica la agrupa
        ]
      })

      const res = await asistenciaController.getStatsBySensei('s1', { fecha_inicio: '2026-01-01' })

      expect(res.success).toBe(true)
      expect(asistenciaService.getDetalleBySesion).toHaveBeenCalledWith('sesion1')
      // Mapeo en el controlador junta todos => el mock dice que tiene j1 con una presente y una ausente
      // en un solo array simulado. Verifiquemos si agrupa j1.
      expect(res.data![0].judoka_id).toBe('j1')
      expect(res.data![0].presentes).toBe(1)
      expect(res.data![0].ausentes).toBe(1)
    })
  })

  // ============================================================================
  // ESTADÍSTICAS DEL CLUB
  // ============================================================================

  describe('getStatsJudokasByClub', () => {
    it('falla sin clubId', async () => {
      const res = await asistenciaController.getStatsJudokasByClub('', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      expect(res.success).toBe(false)
    })

    it('devuelve error si getByClub falla', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ success: false, error: 'DB Error' })
      const res = await asistenciaController.getStatsJudokasByClub('c1', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      expect(res.success).toBe(false)
    })

    it('devuelve array vacío si no hay sesiones filtradas', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ success: true, data: [{ id: 's1', fecha: '2025-01-01' }] })
      const res = await asistenciaController.getStatsJudokasByClub('c1', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      expect(res.success).toBe(true)
      expect(res.data).toEqual([])
    })

    it('agrupa por judoka y calcula correctamente total, presentes y ausentes', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ id: 'sesion-valida', fecha: '2026-05-01', sensei_id: 's1' }] 
      })
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          { judoka_id: 'j1', nombre_judoka: 'A', apellido_judoka: 'B', estado: 'presente' },
          { judoka_id: 'j2', nombre_judoka: 'X', apellido_judoka: 'Y', estado: 'ausente' }
        ]
      })

      const res = await asistenciaController.getStatsJudokasByClub('c1', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(2)
      
      const judoka1 = res.data!.find(d => d.judoka_id === 'j1')
      expect(judoka1?.total_sesiones).toBe(1)
      expect(judoka1?.presentes).toBe(1)
      expect(judoka1?.ausentes).toBe(0)
      expect(judoka1?.porcentaje).toBe(100)

      const judoka2 = res.data!.find(d => d.judoka_id === 'j2')
      expect(judoka2?.presentes).toBe(0)
      expect(judoka2?.ausentes).toBe(1)
      expect(judoka2?.porcentaje).toBe(0)
    })
  })

  describe('getReporteClub', () => {
    it('falla sin clubId', async () => {
      const res = await asistenciaController.getReporteClub('', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      expect(res.success).toBe(false)
    })

    it('retorna error de servicio si getByClub falla', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ success: false, error: 'DB Error' })
      const res = await asistenciaController.getReporteClub('c1', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      expect(res.success).toBe(false)
    })

    it('devuelve stats en ceros si no hay sesiones en el rango', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ success: true, data: [] })
      const res = await asistenciaController.getReporteClub('c1', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      expect(res.success).toBe(true)
      expect(res.data?.stats_globales.total_sesiones).toBe(0)
      expect(res.data?.stats_por_sensei).toEqual([])
    })

    it('orquesta el reporte validando promedios globales y por sensei', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ id: 's1', fecha: '2026-05-01', sensei_id: 'sensei-X', nombre_sensei: 'Xavier' }] 
      })
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [
          { estado: 'presente' }, { estado: 'presente' }, { estado: 'ausente' }
        ]
      })

      const res = await asistenciaController.getReporteClub('c1', { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      
      expect(res.success).toBe(true)
      expect(res.data?.stats_globales.total_sesiones).toBe(1)
      expect(res.data?.stats_globales.promedio_asistencia).toBe(66.67) // 2 presentes / 3 total = 66.666...
      expect(res.data?.stats_por_sensei[0].sensei_id).toBe('sensei-X')
      expect(res.data?.stats_por_sensei[0].promedio_asistencia).toBe(66.67)
    })

    it('maneja error cuando getDetalleBySesion falla en el reporte', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ id: 's1', fecha: '2026-05-01', sensei_id: 's1', nombre_sensei: 'S' }] 
      })
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Error Detalle'
      })

      const res = await asistenciaController.getReporteClub('c1')
      expect(res.success).toBe(true) 
      expect(res.data?.stats_globales.total_sesiones).toBe(0)
    })
  })

  describe('Flujos de Error Adicionales', () => {
    it('maneja error en getSesionesByClub cuando getDetalleBySesion falla', async () => {
      ;(asistenciaService.getByClub as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ id: 's1' }] 
      })
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({
        success: false
      })
      const res = await asistenciaController.getSesionesByClub('c1')
      expect(res.success).toBe(true)
      expect(res.data![0].total_presentes).toBeUndefined()
    })

    it('maneja error en getSesionesBySensei cuando getDetalleBySesion falla', async () => {
      ;(asistenciaService.getBySensei as jest.Mock).mockResolvedValueOnce({ 
        success: true, 
        data: [{ id: 's1' }] 
      })
      ;(asistenciaService.getDetalleBySesion as jest.Mock).mockResolvedValueOnce({
        success: false
      })
      const res = await asistenciaController.getSesionesBySensei('s1')
      expect(res.success).toBe(true)
      expect(res.data![0].total_presentes).toBeUndefined()
    })

    it('falla getStatsJudoka si el historial falla', async () => {
      ;(asistenciaService.getHistorialByJudoka as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Historial Error'
      })
      const res = await asistenciaController.getStatsJudoka('j1')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Historial Error')
    })

    it('retorna error en getStatsBySensei si el servicio falla', async () => {
      ;(asistenciaService.getBySensei as jest.Mock).mockResolvedValueOnce({ success: false, error: 'DB Fail' })
      const res = await asistenciaController.getStatsBySensei('s1')
      expect(res.success).toBe(false)
      expect(res.error).toBe('DB Fail')
    })
  })
})

