
import { render, screen, fireEvent } from '@testing-library/react'
import ClubCard from '../ClubCard'
import { Club } from '@/models/club'

const mockClub: Club = {
  id: '1',
  nombre_club: 'Club de Judo A',
  provincia: 'Ciudad Capital',
  telefono_contacto: '123-456-7890',
  activo: true,
  director_tecnico_id: 'dt-1',
  direccion: 'Calle Falsa 123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

describe('ClubCard', () => {
  it('debe renderizar el nombre del club', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('Club de Judo A')).toBeInTheDocument()
  })

  it('debe renderizar el municipio', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('📍 Ciudad Capital')).toBeInTheDocument()
  })

  it('debe renderizar el teléfono de contacto', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('📞 123-456-7890')).toBeInTheDocument()
  })

  it('debe mostrar un chip "Activo" para un club activo', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('debe mostrar un chip "Inactivo" para un club inactivo', () => {
    const inactiveClub = { ...mockClub, activo: false }
    render(<ClubCard club={inactiveClub} />)
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('debe llamar a la función onClick cuando se hace clic en la tarjeta', () => {
    const handleClick = jest.fn()
    render(<ClubCard club={mockClub} onClick={handleClick} />)
    // La tarjeta tiene cursor pointer, lo que sugiere que es clickeable.
    // Buscamos por el contenedor principal de la tarjeta.
    const cardElement = screen.getByText('Club de Judo A').closest('.MuiCard-root')
    expect(cardElement).not.toBeNull()
    fireEvent.click(cardElement!)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('no debe lanzar un error si onClick no se proporciona y se hace clic', () => {
    render(<ClubCard club={mockClub} />)
    const cardElement = screen.getByText('Club de Judo A').closest('.MuiCard-root')
    expect(() => fireEvent.click(cardElement!)).not.toThrow()
  })

  it('debe renderizar correctamente cuando los campos opcionales son nulos', () => {
    const partialClub: Club = {
      ...mockClub,
      provincia: null,
      telefono_contacto: null
    }
    render(<ClubCard club={partialClub} />)
    expect(screen.getByText('Club de Judo A')).toBeInTheDocument()
    expect(screen.queryByText(/📍/)).not.toBeInTheDocument()
    expect(screen.queryByText(/📞/)).not.toBeInTheDocument()
  })
})

