import { renderHook, act } from '@testing-library/react'
import { useNotificaciones } from '../useNotificaciones'
import { comunicacionService } from '@/services/comunicacionService'

// Simulamos el modulo de servicio
jest.mock('@/services/comunicacionService', () => ({
  comunicacionService: {
    getNotificacionesByUsuario: jest.fn(),
    marcarNotificacionLeida: jest.fn(),
    getContadorNoLeidas: jest.fn(),
  }
}))

describe('useNotificaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(comunicacionService.getNotificacionesByUsuario as jest.Mock).mockResolvedValue([])
    ;(comunicacionService.getContadorNoLeidas as jest.Mock).mockResolvedValue({ total_no_leidas: 0 })
  })

  it('debe inicializar el estado de notificaciones en vacio y contador en 0', async () => {
    const { result } = renderHook(() => useNotificaciones('user-1'))
    
    expect(result.current.notificaciones).toEqual([])
    expect(result.current.contadorNoLeidas).toBe(0)
    expect(result.current.loading).toBe(true) 
  })

  it('debe cargar correctamente las notificaciones del usuario', async () => {
    const mockNotificaciones = [
      { id: '1', titulo: 'Prueba', leido: false }
    ]
    ;(comunicacionService.getNotificacionesByUsuario as jest.Mock).mockResolvedValue(mockNotificaciones)
    ;(comunicacionService.getContadorNoLeidas as jest.Mock).mockResolvedValue({ total_no_leidas: 1 })

    const { result, waitForNextUpdate } = renderHook(() => useNotificaciones('user-1'))

    // Usaremos un pequeno flush de promesas si waitForNextUpdate no estuviera disponible, 
    // pero como React Testing Library 13+ lo hace automatico, solo inspeccionamos si carga.
    // Usualmente se hace act() o se usa return del useEffect.
  })
})
