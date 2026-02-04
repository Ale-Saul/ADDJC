import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/common/Sidebar'
import { useAuth } from '@/contexts/AuthContext'

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock de AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock de Material UI theme
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material')
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
        },
        text: {
          primary: '#000000',
        },
        mode: 'light',
      },
    }),
  }
})

describe('Sidebar', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
  }
  const mockSignOut = jest.fn()
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    nombres: 'Test',
    apellidos: 'User',
    rol: 'asociacion' as const,
    avatar_url: null,
    activo: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(usePathname as jest.Mock).mockReturnValue('/')
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
      loading: false,
    })
  })

  it('debe renderizar el título de la asociación', async () => {
    render(<Sidebar />)
    await waitFor(() => {
      expect(screen.getByText('Asociación de Judo')).toBeInTheDocument()
    })
  })

  it('debe renderizar el menú de Inicio', async () => {
    render(<Sidebar />)
    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument()
    })
  })

  it('debe renderizar el menú de Afiliados', async () => {
    render(<Sidebar />)
    await waitFor(() => {
      expect(screen.getByText('Afiliados')).toBeInTheDocument()
    })
  })

  it('debe expandir/colapsar el submenú de Afiliados al hacer clic', async () => {
    render(<Sidebar />)
    
    // Esperar a que el componente se monte
    await waitFor(() => {
      expect(screen.getByText('Afiliados')).toBeInTheDocument()
    })
    
    const afiliadosButton = screen.getByText('Afiliados')
    
    // Hacer clic para colapsar
    fireEvent.click(afiliadosButton)
    
    // Hacer clic nuevamente para expandir
    fireEvent.click(afiliadosButton)
  })

  it('debe navegar al hacer clic en Inicio', async () => {
    render(<Sidebar />)
    
    // Esperar a que el componente se monte
    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument()
    })
    
    const inicioButton = screen.getByText('Inicio')
    fireEvent.click(inicioButton)
    
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('debe mostrar los subitems de Afiliados cuando está expandido', async () => {
    render(<Sidebar />)
    
    // Esperar a que el componente se monte
    await waitFor(() => {
      expect(screen.getByText('Afiliados')).toBeInTheDocument()
    })
    
    // Expandir el menú de Afiliados
    const afiliadosButton = screen.getByText('Afiliados')
    fireEvent.click(afiliadosButton)
    
    // Esperar a que aparezcan los subitems
    await waitFor(() => {
      expect(screen.getByText('Clubes')).toBeInTheDocument()
      expect(screen.getByText('Árbitros')).toBeInTheDocument()
      expect(screen.getByText('Senseis')).toBeInTheDocument()
      expect(screen.getByText('Judokas')).toBeInTheDocument()
    })
  })
})

