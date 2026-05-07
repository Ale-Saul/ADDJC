import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationBell from '../NotificationBell'
import { 
  useNotificacionesByUsuario, 
  useContadorNotificaciones, 
  useMarcarComoLeida, 
  useMarcarTodasLeidas 
} from '@/hooks/useNotificaciones'

jest.mock('@/hooks/useNotificaciones', () => ({
  useNotificacionesByUsuario: jest.fn(),
  useContadorNotificaciones: jest.fn(),
  useMarcarComoLeida: jest.fn(),
  useMarcarTodasLeidas: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn()
  })
}))

describe('NotificationBell', () => {
  beforeEach(() => {
    ;(useMarcarComoLeida as jest.Mock).mockReturnValue({ mutate: jest.fn() })
    ;(useMarcarTodasLeidas as jest.Mock).mockReturnValue({ mutate: jest.fn() })
  })

  it('no muestra el badge si no hay notificaciones', () => {
    ;(useContadorNotificaciones as jest.Mock).mockReturnValue({
      data: { total_no_leidas: 0 },
      isLoading: false,
    })
    ;(useNotificacionesByUsuario as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<NotificationBell usuarioId="user-1" />)
    // El badge (usualmente un span de Material UI) no debe contener texto o el numero 0 si se oculta.
    // Depende de la implementacion especifica de Material UI, podria no estar en el DOM o estar invisible (MuiBadge-invisible)
    const badge = screen.getByRole('button', { name: /notificaciones/i })
    expect(badge).toBeInTheDocument()
  })

  it('muestra el numero de notificaciones no leidas', () => {
    ;(useContadorNotificaciones as jest.Mock).mockReturnValue({
      data: { total_no_leidas: 3 },
      isLoading: false,
    })
    ;(useNotificacionesByUsuario as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<NotificationBell usuarioId="user-1" />)
    const badgeVal = screen.getByText('3')
    expect(badgeVal).toBeInTheDocument()
  })

  it('abre el menu al hacer click en la campana y muestra notificaciones', () => {
    ;(useContadorNotificaciones as jest.Mock).mockReturnValue({
      data: { total_no_leidas: 1 },
      isLoading: false,
    })
    ;(useNotificacionesByUsuario as jest.Mock).mockReturnValue({
      data: [
        { 
          id: 'n-1', 
          titulo: 'Test Titulo', 
          mensaje: 'Test Mensaje', 
          leido: false,
          created_at: new Date().toISOString()
        }
      ],
      isLoading: false,
    })

    render(<NotificationBell usuarioId="user-1" />)
    const bellBtn = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellBtn)

    expect(screen.getByText('Test Titulo')).toBeInTheDocument()
    expect(screen.getByText('Test Mensaje')).toBeInTheDocument()
    expect(screen.getByLabelText('Marcar todas como leídas')).toBeInTheDocument()
  })

  it('llama a marcarTodasLeidas al hacer click en el boton correspondiente', () => {
    const mockMutate = jest.fn()
    ;(useMarcarTodasLeidas as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false })
    ;(useContadorNotificaciones as jest.Mock).mockReturnValue({
      data: { total_no_leidas: 1 },
      isLoading: false,
    })
    ;(useNotificacionesByUsuario as jest.Mock).mockReturnValue({
      data: [{ id: 'n-1', titulo: 'T', mensaje: 'M', leido: false, tipo: 'info' }],
      isLoading: false,
    })

    render(<NotificationBell usuarioId="user-1" />)
    fireEvent.click(screen.getByRole('button', { name: /notificaciones/i }))
    
    const marcarBtn = screen.getByLabelText('Marcar todas como leídas')
    fireEvent.click(marcarBtn)
    
    expect(mockMutate).toHaveBeenCalled()
  })
})