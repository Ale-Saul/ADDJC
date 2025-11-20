import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/common/Sidebar'

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(usePathname as jest.Mock).mockReturnValue('/')
  })

  it('debe renderizar el título de la asociación', () => {
    render(<Sidebar />)
    expect(screen.getByText('Asociación de Judo')).toBeInTheDocument()
  })

  it('debe renderizar el menú de Inicio', () => {
    render(<Sidebar />)
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('debe renderizar el menú de Afiliados', () => {
    render(<Sidebar />)
    expect(screen.getByText('Afiliados')).toBeInTheDocument()
  })

  it('debe expandir/colapsar el submenú de Afiliados al hacer clic', async () => {
    render(<Sidebar />)
    
    const afiliadosButton = screen.getByText('Afiliados')
    
    // Inicialmente debería estar expandido (después del mount)
    // Esperamos un poco para que el useEffect se ejecute
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Hacer clic para colapsar
    fireEvent.click(afiliadosButton)
    
    // Hacer clic nuevamente para expandir
    fireEvent.click(afiliadosButton)
  })

  it('debe navegar al hacer clic en Inicio', async () => {
    render(<Sidebar />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const inicioButton = screen.getByText('Inicio')
    fireEvent.click(inicioButton)
    
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('debe mostrar los subitems de Afiliados cuando está expandido', async () => {
    render(<Sidebar />)
    
    // Esperar a que el componente se monte y el submenú se expanda
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Clubes')).toBeInTheDocument()
    expect(screen.getByText('Árbitros')).toBeInTheDocument()
    expect(screen.getByText('Senseis')).toBeInTheDocument()
    expect(screen.getByText('Judokas')).toBeInTheDocument()
  })
})

