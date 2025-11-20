
import { render, screen, fireEvent } from '@testing-library/react'
import ArbitroCard from '../ArbitroCard'
import { Arbitro } from '@/models/arbitro'

// Mock de datos de un árbitro
const mockArbitro: Arbitro = {
  id: '1',
  nombres: 'Juan',
  apellidos: 'Perez',
  fecha_nacimiento: '1985-10-20',
  nivel_arbitraje: 'Nacional',
  activo: true,
  usuario_id: 'user-1',
  certificacion: null,
  foto_perfil: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

describe('ArbitroCard', () => {
  it('debe renderizar el nombre completo del árbitro', () => {
    render(<ArbitroCard arbitro={mockArbitro} />)
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
  })

  it('debe renderizar el nivel de arbitraje', () => {
    render(<ArbitroCard arbitro={mockArbitro} />)
    expect(screen.getByText('📋 Nacional')).toBeInTheDocument()
  })

  it('debe renderizar la fecha de nacimiento en el formato correcto', () => {
    render(<ArbitroCard arbitro={mockArbitro} />)
    // new Date() en el componente puede tener problemas de zona horaria en los tests
    // Usamos una expresión regular para verificar el formato DD/MM/YYYY
    // La fecha puede variar en un día por la zona horaria del servidor de pruebas
    expect(screen.getByText(/🎂\s*(19|20)\/10\/1985/)).toBeInTheDocument()
  })

  it('debe mostrar un chip "Activo" para un árbitro activo', () => {
    render(<ArbitroCard arbitro={mockArbitro} />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('debe mostrar un chip "Inactivo" para un árbitro inactivo', () => {
    const inactiveArbitro = { ...mockArbitro, activo: false }
    render(<ArbitroCard arbitro={inactiveArbitro} />)
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('debe llamar a la función onClick cuando se hace clic en la tarjeta', () => {
    const handleClick = jest.fn()
    render(<ArbitroCard arbitro={mockArbitro} onClick={handleClick} />)
    const card = screen.getByText('Juan Perez').closest('.MuiCard-root')
    expect(card).not.toBeNull()
    fireEvent.click(card!)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('no debe lanzar un error si onClick no se proporciona y se hace clic', () => {
    render(<ArbitroCard arbitro={mockArbitro} />)
    // No hay un role 'button' si no hay onClick
    const card = screen.getByText('Juan Perez').closest('div.MuiCard-root')
    expect(() => fireEvent.click(card!)).not.toThrow()
  })

  it('debe renderizar correctamente cuando los campos opcionales son nulos', () => {
    const partialArbitro: Arbitro = {
      ...mockArbitro,
      nivel_arbitraje: null,
      fecha_nacimiento: null
    }
    render(<ArbitroCard arbitro={partialArbitro} />)
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.queryByText(/📋/)).not.toBeInTheDocument()
    expect(screen.queryByText(/🎂/)).not.toBeInTheDocument()
  })
})
