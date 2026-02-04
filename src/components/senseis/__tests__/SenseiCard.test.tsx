import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SenseiCard from '../SenseiCard'
import { Sensei } from '@/models/sensei'

describe('SenseiCard', () => {
  const mockSensei: Sensei = {
    id: '1',
    usuario_id: 'user-123',
    club_id: 'club-456',
    nombres: 'Carlos',
    apellidos: 'García',
    fecha_nacimiento: '1980-05-15',
    grado_dan: '5to Dan',
    certificacion: 'Certificado Internacional',
    especialidad: 'Kata',
    foto_perfil: null,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('debe renderizar correctamente la información del sensei', () => {
    render(<SenseiCard sensei={mockSensei} />)

    expect(screen.getByText('Carlos García')).toBeInTheDocument()
    expect(screen.getByText('🥋 5to Dan')).toBeInTheDocument()
    expect(screen.getByText('📚 Kata')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('debe mostrar estado "Inactivo" para sensei inactivo', () => {
    const senseiInactivo = { ...mockSensei, activo: false }
    render(<SenseiCard sensei={senseiInactivo} />)

    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('debe ocultar grado dan cuando no está disponible', () => {
    const senseiSinGrado = { ...mockSensei, grado_dan: null }
    render(<SenseiCard sensei={senseiSinGrado} />)

    expect(screen.queryByText(/🥋/)).not.toBeInTheDocument()
  })

  it('debe ocultar especialidad cuando no está disponible', () => {
    const senseiSinEspecialidad = { ...mockSensei, especialidad: null }
    render(<SenseiCard sensei={senseiSinEspecialidad} />)

    expect(screen.queryByText(/📚/)).not.toBeInTheDocument()
  })

  it('debe mostrar solo el nombre cuando grado y especialidad son nulos', () => {
    const senseiMinimo = { 
      ...mockSensei, 
      grado_dan: null, 
      especialidad: null 
    }
    render(<SenseiCard sensei={senseiMinimo} />)

    expect(screen.getByText('Carlos García')).toBeInTheDocument()
    expect(screen.queryByText(/🥋/)).not.toBeInTheDocument()
    expect(screen.queryByText(/📚/)).not.toBeInTheDocument()
  })

  it('debe manejar grado dan como string vacío', () => {
    const senseiGradoVacio = { ...mockSensei, grado_dan: '' }
    render(<SenseiCard sensei={senseiGradoVacio} />)

    expect(screen.queryByText(/🥋/)).not.toBeInTheDocument()
  })

  it('debe manejar especialidad como string vacío', () => {
    const senseiEspecialidadVacia = { ...mockSensei, especialidad: '' }
    render(<SenseiCard sensei={senseiEspecialidadVacia} />)

    expect(screen.queryByText(/📚/)).not.toBeInTheDocument()
  })

  it('debe ejecutar callback onClick cuando se proporciona', () => {
    const mockOnClick = jest.fn()
    render(<SenseiCard sensei={mockSensei} onClick={mockOnClick} />)

    const card = screen.getByText('Carlos García').closest('[role="button"], div')
    fireEvent.click(card!)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('debe aplicar cursor pointer cuando onClick está definido', () => {
    const mockOnClick = jest.fn()
    render(<SenseiCard sensei={mockSensei} onClick={mockOnClick} />)

    const card = screen.getByText('Carlos García').closest('.MuiCard-root')
    expect(card).toHaveStyle('cursor: pointer')
  })

  it('debe aplicar cursor default cuando onClick no está definido', () => {
    render(<SenseiCard sensei={mockSensei} />)

    const card = screen.getByText('Carlos García').closest('.MuiCard-root')
    expect(card).toHaveStyle('cursor: default')
  })

  it('debe mostrar chip verde para sensei activo', () => {
    render(<SenseiCard sensei={mockSensei} />)

    const chip = screen.getByText('Activo')
    expect(chip).toBeInTheDocument()
    // En MUI, el color se aplica como clase CSS
    expect(chip.closest('.MuiChip-colorSuccess')).toBeTruthy()
  })

  it('debe mostrar chip gris para sensei inactivo', () => {
    const senseiInactivo = { ...mockSensei, activo: false }
    render(<SenseiCard sensei={senseiInactivo} />)

    const chip = screen.getByText('Inactivo')
    expect(chip).toBeInTheDocument()
    // Para el color default, no hay una clase específica o es MuiChip-colorDefault
    expect(chip.closest('.MuiChip-colorDefault')).toBeTruthy()
  })

  it('debe renderizar nombres y apellidos por separado correctamente', () => {
    const senseiNombresCompuestos = {
      ...mockSensei,
      nombres: 'Juan Carlos',
      apellidos: 'García López'
    }
    render(<SenseiCard sensei={senseiNombresCompuestos} />)

    expect(screen.getByText('Juan Carlos García López')).toBeInTheDocument()
  })
})