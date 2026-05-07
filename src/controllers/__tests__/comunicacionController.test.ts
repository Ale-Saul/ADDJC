import { comunicacionController } from '../comunicacionController'
import { comunicacionService } from '../../services/comunicacionService'
import { createClient } from '@/lib/supabase/client'
import { ROL } from '@/constants/roles'

// Mock del servicio
jest.mock('../../services/comunicacionService', () => ({
  comunicacionService: {
    getNoticiasByClub: jest.fn(),
    getNoticiasDestacadas: jest.fn(),
    getNoticiaById: jest.fn(),
    createNoticia: jest.fn(),
    updateNoticia: jest.fn(),
    deleteNoticia: jest.fn(),
    getDestinatariosByClub: jest.fn(),
    getDestinatariosParaAsociacion: jest.fn(),
    createNotificacion: jest.fn(),
    getNotificacionesByUsuario: jest.fn(),
    marcarTodasLeidas: jest.fn(),
    uploadImagenNoticia: jest.fn(),
    getContadorNoLeidas: jest.fn(),
    getDestinatarioActivoById: jest.fn(),
    usuarioPerteneceAClub: jest.fn(),
    existeNotificacionOrigen: jest.fn(),
    marcarComoLeida: jest.fn(),
  }
}))

// Mock de Supabase para las consultas directas en el controller
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  then: jest.fn().mockImplementation((onSuccess) => {
    return Promise.resolve(onSuccess({ data: [], error: null }));
  })
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

describe('comunicacionController - Pruebas de Integración y Lógica', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  // UUIDs válidos para pasar las validaciones de Zod
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'
  const otherUUID = '6eb2cd39-012b-427c-9a40-e22d10098dfc'

  describe('Gestión de Noticias', () => {
    it('getNoticiasByClub: debe validar filtros (UUID) y llamar al servicio', async () => {
      ;(comunicacionService.getNoticiasByClub as jest.Mock).mockResolvedValueOnce([])
      
      const res = await comunicacionController.getNoticiasByClub(validUUID, { categoria: 'institucional' })
      expect(res.success).toBe(true)
      expect(comunicacionService.getNoticiasByClub).toHaveBeenCalledWith(validUUID, expect.objectContaining({
        categoria: 'institucional'
      }))
    })

    it('getNoticiasByClub: debe permitir "global" sin ser UUID', async () => {
      ;(comunicacionService.getNoticiasByClub as jest.Mock).mockResolvedValueOnce([])
      const res = await comunicacionController.getNoticiasByClub('global')
      expect(res.success).toBe(true)
    })

    it('getNoticiasByClub: debe manejar errores del servicio', async () => {
      ;(comunicacionService.getNoticiasByClub as jest.Mock).mockRejectedValueOnce(new Error('Fail'))
      const res = await comunicacionController.getNoticiasByClub(validUUID)
      expect(res.success).toBe(false)
      expect(res.error).toBe('Error al obtener las noticias')
    })
    it('getNoticiasDestacadas: debe manejar errores del servicio', async () => {
      ;(comunicacionService.getNoticiasDestacadas as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.getNoticiasDestacadas(validUUID)
      expect(res.success).toBe(false)
    })

    it('createNoticia: debe manejar errores del servicio', async () => {
      ;(comunicacionService.createNoticia as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.createNoticia({
        titulo: 'Noticia Error',
        contenido: 'Este contenido es suficientemente largo.',
        autor_id: validUUID,
        categoria: 'institucional',
        fecha_inicio: '2024-01-01',
        audiencia: ['todos']
      })
      expect(res.success).toBe(false)
      expect(res.error).toBe('Error al crear la noticia')
    })

    it('updateNoticia: debe manejar errores del servicio', async () => {
      ;(comunicacionService.getNoticiaById as jest.Mock).mockResolvedValueOnce({ id: validUUID })
      ;(comunicacionService.updateNoticia as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.updateNoticia(validUUID, { titulo: 'Update Error' })
      expect(res.success).toBe(false)
    })

    it('deleteNoticia: debe manejar errores del servicio', async () => {
      ;(comunicacionService.deleteNoticia as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.deleteNoticia(validUUID)
      expect(res.success).toBe(false)
    })  })

  describe('Gestión de Notificaciones', () => {
    it('getNotificacionesByUsuario: debe llamar al servicio', async () => {
      ;(comunicacionService.getNotificacionesByUsuario as jest.Mock).mockResolvedValueOnce([])
      const res = await comunicacionController.getNotificacionesByUsuario(validUUID)
      expect(res.success).toBe(true)
    })

    it('enviarNotificacionManual: debe validar payload (UUIDs) y crear notificación', async () => {
      // Mock de getDestinatarioActivoById para que pase la validación
      const { comunicacionService: service } = require('../../services/comunicacionService')
      service.getDestinatarioActivoById = jest.fn().mockResolvedValueOnce({ id: otherUUID })
      service.createNotificacion.mockResolvedValueOnce({ id: validUUID })
      
      const payload = {
        remitente_id: validUUID,
        remitente_rol: 'asociacion' as const,
        destinatario_id: otherUUID,
        titulo: 'Título Manual',
        mensaje: 'Este es un mensaje de prueba con longitud suficiente.'
      }
      
      const res = await comunicacionController.enviarNotificacionManual(payload)
      expect(res.success).toBe(true)
      expect(service.createNotificacion).toHaveBeenCalled()
    })
  })

  describe('Casos de Borde y Validaciones Schema', () => {
    it('createNoticia: debe fallar si el título es demasiado corto', async () => {
      const payload: any = { titulo: 'ab', contenido: 'válido...', categoria: 'noticia', audiencia: ['todos'], fecha_inicio: '2024-01-01' }
      const res = await comunicacionController.createNoticia(payload)
      expect(res.success).toBe(false)
      // El mensaje exacto vendrá del schema, pero esperamos que falle
    })

    it('notificarNoticiaDestacada: debe manejar errores silenciosamente', async () => {
      mockSupabase.then.mockImplementation((onSuccess: any) => 
        Promise.resolve(onSuccess({ data: null, error: { message: 'DB Error' } }))
      )
      
      const noticia: any = { id: validUUID, club_id: validUUID, es_destacada: true, audiencia: ['todos'] }
      await expect(comunicacionController.notificarNoticiaDestacada(noticia)).resolves.not.toThrow()
    })

    it('getNoticiasParaUsuario: debe manejar flujo de ASOCIACION', async () => {
      mockSupabase.then.mockImplementation((onSuccess: any) => 
        Promise.resolve(onSuccess({ 
          data: [{ 
            id: validUUID, 
            titulo: 'Global', 
            audiencia: ['judokas'], 
            contenido: 'Contenido global largo', 
            activo: true, 
            es_destacada: false, 
            fecha_inicio: '2024-01-01',
            club_id: null,
            categoria: 'institucional'
          }], 
          error: null 
        }))
      )

      // Pasar los argumentos en el orden correcto
      const res = await comunicacionController.getNoticiasParaUsuario('judokas', undefined, ROL.ASOCIACION)
      expect(res.success).toBe(true)
      expect(res.data?.length).toBeGreaterThan(0)
    })

    it('getNoticiasParaUsuario: debe manejar flujo de Club con ID', async () => {
      ;(comunicacionService.getNoticiasByClub as jest.Mock).mockResolvedValueOnce([
        { id: validUUID, audiencia: ['judokas'] }
      ])

      const res = await comunicacionController.getNoticiasParaUsuario(validUUID, ROL.JUDOKA, 'judokas', validUUID)
      expect(res.success).toBe(true)
      expect(comunicacionService.getNoticiasByClub).toHaveBeenCalled()
    })

    it('getNoticiaById: debe retornar error si no se encuentra', async () => {
      ;(comunicacionService.getNoticiaById as jest.Mock).mockResolvedValueOnce(null)
      const res = await comunicacionController.getNoticiaById(validUUID)
      expect(res.success).toBe(false)
      expect(res.error).toContain('encontrada')
    })

    it('getNoticiasParaUsuario: debe manejar flujo de Club sin noticias', async () => {
      ;(comunicacionService.getNoticiasByClub as jest.Mock).mockResolvedValueOnce([])

      const res = await comunicacionController.getNoticiasParaUsuario('judokas', validUUID, ROL.JUDOKA)
      expect(res.success).toBe(true)
      expect(res.data).toEqual([])
    })

    it('getNoticiasParaUsuario: debe manejar flujo global (sin clubId ni asociación)', async () => {
      mockSupabase.then.mockImplementation((onSuccess: any) => 
        Promise.resolve(onSuccess({ 
          data: [{ 
            id: otherUUID, 
            titulo: 'Global Sin Club', 
            audiencia: ['todos'], 
            activo: true, 
            fecha_inicio: '2024-01-01',
            club_id: null,
            categoria: 'evento'
          }], 
          error: null 
        }))
      )

      const res = await comunicacionController.getNoticiasParaUsuario('judokas', undefined, ROL.JUDOKA)
      expect(res.success).toBe(true)
      expect(res.data?.length).toBe(1)
    })

    it('getNoticiasParaUsuario: debe manejar errores en el flujo de asociación', async () => {
      mockSupabase.then.mockImplementation((onSuccess: any) => 
        Promise.resolve(onSuccess({ data: null, error: { message: 'DB Error' } }))
      )

      const res = await comunicacionController.getNoticiasParaUsuario('judokas', undefined, ROL.ASOCIACION)
      expect(res.success).toBe(false)
      expect(res.error).toBe('Error al obtener las noticias')
    })
  })

  describe('Funciones Adicionales del Controlador', () => {
    it('updateNoticia: debe actualizar y notificar si se marca como destacada', async () => {
      const noticiaOriginal = { id: validUUID, es_destacada: false, audiencia: ['judokas'] }
      const noticiaActualizada = { id: validUUID, es_destacada: true, audiencia: ['judokas'] }
      
      ;(comunicacionService.getNoticiaById as jest.Mock).mockResolvedValueOnce(noticiaOriginal)
      ;(comunicacionService.updateNoticia as jest.Mock).mockResolvedValueOnce(noticiaActualizada)
      
      const spyNotificar = jest.spyOn(comunicacionController, 'notificarNoticiaDestacada').mockImplementation(async () => {})
      
      const res = await comunicacionController.updateNoticia(validUUID, { es_destacada: true })
      
      expect(res.success).toBe(true)
      expect(spyNotificar).toHaveBeenCalled()
      spyNotificar.mockRestore()
    })

    it('deleteNoticia: debe llamar al servicio', async () => {
      ;(comunicacionService.deleteNoticia as jest.Mock).mockResolvedValueOnce(undefined)
      const res = await comunicacionController.deleteNoticia(validUUID)
      expect(res.success).toBe(true)
      expect(comunicacionService.deleteNoticia).toHaveBeenCalledWith(validUUID)
    })

    it('getContadorNoLeidas: debe retornar el contador del servicio', async () => {
      const mockContador = { total: 5, alta_prioridad: true }
      ;(comunicacionService.getContadorNoLeidas as jest.Mock).mockResolvedValueOnce(mockContador)
      const res = await comunicacionController.getContadorNoLeidas(validUUID)
      expect(res.success).toBe(true)
      expect(res.data).toEqual(mockContador)
    })

    it('marcarComoLeida: debe validar prioridad alta', async () => {
      const res = await comunicacionController.marcarComoLeida(validUUID, 'alta')
      expect(res.success).toBe(false)
      expect(res.error).toContain('críticas')
    })

    it('getDestinatariosNotificacion: debe diferenciar entre ASOCIACION y ENCARGADO', async () => {
      ;(comunicacionService.getDestinatariosParaAsociacion as jest.Mock).mockResolvedValueOnce([])
      await comunicacionController.getDestinatariosNotificacion(ROL.ASOCIACION)
      expect(comunicacionService.getDestinatariosParaAsociacion).toHaveBeenCalled()

      ;(comunicacionService.getDestinatariosByClub as jest.Mock).mockResolvedValueOnce([])
      await comunicacionController.getDestinatariosNotificacion(ROL.ENCARGADO, validUUID)
      expect(comunicacionService.getDestinatariosByClub).toHaveBeenCalledWith(validUUID, undefined)
    })

    it('notificarPagoPendiente: debe usar enviarNotificacion', async () => {
      const spyEnviar = jest.spyOn(comunicacionController, 'enviarNotificacion').mockResolvedValueOnce({ success: true })
      await comunicacionController.notificarPagoPendiente(validUUID, { monto: 100, vencimiento: '2024-12-31', pagoId: otherUUID })
      expect(spyEnviar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'pago', prioridad: 'alta' }))
      spyEnviar.mockRestore()
    })

    it('notificarNoticiaDestacada: debe manejar flujo con club_id y usuarios', async () => {
      const noticia = { id: validUUID, club_id: validUUID, es_destacada: true, audiencia: ['judokas'], titulo: 'T' }
      
      mockSupabase.then.mockImplementation((onSuccess: any) => 
        Promise.resolve(onSuccess({ 
          data: [{ id: otherUUID, rol: 'judoka' }], 
          error: null 
        }))
      )

      const spyEnviar = jest.spyOn(comunicacionController, 'enviarNotificacion').mockResolvedValue({ success: true })
      
      await comunicacionController.notificarNoticiaDestacada(noticia as any)
      
      expect(spyEnviar).toHaveBeenCalled()
      spyEnviar.mockRestore()
    })

    it('updateNoticia: debe fallar si el ID es nulo', async () => {
      const res = await comunicacionController.updateNoticia('', {})
      expect(res.success).toBe(false)
      expect(res.error).toContain('ID')
    })

    it('updateNoticia: debe validar el payload con Zod', async () => {
      ;(comunicacionService.getNoticiaById as jest.Mock).mockResolvedValueOnce({ id: validUUID })
      const res = await comunicacionController.updateNoticia(validUUID, { titulo: 'ab' }) // Corto
      expect(res.success).toBe(false)
      expect(res.error).toContain('3 caracteres')
    })

    it('getNotificacionesByUsuario: debe fallar si no hay usuarioId', async () => {
      const res = await comunicacionController.getNotificacionesByUsuario('')
      expect(res.success).toBe(false)
    })

    it('getDestinatariosNotificacion: debe fallar si ENCARGADO no tiene clubId', async () => {
      const res = await comunicacionController.getDestinatariosNotificacion(ROL.ENCARGADO, null)
      expect(res.success).toBe(false)
      expect(res.error).toContain('club asignado')
    })

    it('marcarTodasLeidas: debe llamar al servicio', async () => {
      ;(comunicacionService.marcarTodasLeidas as jest.Mock).mockResolvedValueOnce(undefined)
      const res = await comunicacionController.marcarTodasLeidas(validUUID)
      expect(res.success).toBe(true)
      expect(comunicacionService.marcarTodasLeidas).toHaveBeenCalledWith(validUUID)
    })

    it('marcarTodasLeidas: debe fallar si no hay usuarioId', async () => {
      const res = await comunicacionController.marcarTodasLeidas('')
      expect(res.success).toBe(false)
    })

    it('notificarHabilitacionExamen: debe usar enviarNotificacion', async () => {
      const spyEnviar = jest.spyOn(comunicacionController, 'enviarNotificacion').mockResolvedValueOnce({ success: true } as any)
      await comunicacionController.notificarHabilitacionExamen(validUUID, { cinturon: 'Amarillo', fecha: '2024-01-01' })
      expect(spyEnviar).toHaveBeenCalledWith(expect.objectContaining({ titulo: expect.stringContaining('Habilitado') }))
      spyEnviar.mockRestore()
    })

    it('getDestinatariosNotificacion: debe filtrar por búsqueda', async () => {
      ;(comunicacionService.getDestinatariosParaAsociacion as jest.Mock).mockResolvedValueOnce([])
      await comunicacionController.getDestinatariosNotificacion(ROL.ASOCIACION, null, 'juan')
      expect(comunicacionService.getDestinatariosParaAsociacion).toHaveBeenCalledWith('juan')
    })

    it('getDestinatariosNotificacion: debe manejar errores del servicio', async () => {
      ;(comunicacionService.getDestinatariosParaAsociacion as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.getDestinatariosNotificacion(ROL.ASOCIACION)
      expect(res.success).toBe(false)
      expect(res.error).toBe('Error al obtener destinatarios')
    })

    it('getNotificacionesByUsuario: debe manejar errores del servicio', async () => {
      ;(comunicacionService.getNotificacionesByUsuario as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.getNotificacionesByUsuario(validUUID)
      expect(res.success).toBe(false)
    })

    it('getContadorNoLeidas: debe manejar errores del servicio', async () => {
      ;(comunicacionService.getContadorNoLeidas as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.getContadorNoLeidas(validUUID)
      expect(res.success).toBe(false)
    })

    it('marcarTodasLeidas: debe manejar errores del servicio', async () => {
      ;(comunicacionService.marcarTodasLeidas as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.marcarTodasLeidas(validUUID)
      expect(res.success).toBe(false)
    })

    it('marcarComoLeida: debe manejar errores del servicio', async () => {
      ;(comunicacionService.marcarComoLeida as jest.Mock).mockRejectedValueOnce(new Error('Fatal'))
      const res = await comunicacionController.marcarComoLeida(validUUID, 'normal')
      expect(res.success).toBe(false)
    })
  })
})
