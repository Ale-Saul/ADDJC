import { render, screen, fireEvent } from '@testing-library/react'
import JudokaCard from '../JudokaCard'
import { Judoka } from '@/models/judoka'

describe('JudokaCard', () => {
  const mockJudoka: Judoka = {
    id: '1',
    usuario_id: 'user-1',
    club_id: 'club-1',
    entrenador_id: 'sensei-1',
    nombres: 'Juan',
    apellidos: 'Perez',
    fecha_nacimiento: '1990-01-01',
    categoria: 'Senior',
    peso_competitivo: 81,
    cinturon_actual: 'Negro',
    foto_perfil: null,
    activo: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  }

  it('should render judoka information correctly', () => {
    render(<JudokaCard judoka={mockJudoka} />)

    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText(/Negro/)).toBeInTheDocument()
    expect(screen.getByText(/Senior/)).toBeInTheDocument()
    expect(screen.getByText(/81 kg/)).toBeInTheDocument()
  })

  it('should render inactive status correctly', () => {
    const inactiveJudoka = { ...mockJudoka, activo: false }
    render(<JudokaCard judoka={inactiveJudoka} />)

    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('should handle missing optional fields', () => {
    const minimalJudoka: Judoka = {
      ...mockJudoka,
      categoria: null,
      peso_competitivo: null,
      cinturon_actual: null
    }

    render(<JudokaCard judoka={minimalJudoka} />)

    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.queryByText(/Negro/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Senior/)).not.toBeInTheDocument()
    expect(screen.queryByText(/kg/)).not.toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<JudokaCard judoka={mockJudoka} onClick={handleClick} />)

    fireEvent.click(screen.getByText('Juan Perez'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should have pointer cursor when onClick is provided', () => {
    const { container } = render(<JudokaCard judoka={mockJudoka} onClick={() => {}} />)
    // Material UI Card renders as a div with MuiCard-root class
    const card = container.firstChild
    expect(card).toHaveStyle('cursor: pointer')
  })

  it('should have default cursor when onClick is not provided', () => {
    const { container } = render(<JudokaCard judoka={mockJudoka} />)
    const card = container.firstChild
    expect(card).toHaveStyle('cursor: default')
  })
})
