import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JudokaList from '../JudokaList'
import { judokaController } from '@/controllers/judokaController'

// Mock judokaController
jest.mock('@/controllers/judokaController')

describe('JudokaList', () => {
  const mockJudokas = [
    {
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
    },
    {
      id: '2',
      usuario_id: 'user-2',
      club_id: 'club-1',
      entrenador_id: 'sensei-1',
      nombres: 'Maria',
      apellidos: 'Gomez',
      fecha_nacimiento: '1995-05-05',
      categoria: 'Junior',
      peso_competitivo: 57,
      cinturon_actual: 'Azul',
      foto_perfil: null,
      activo: false,
      created_at: '2023-02-01',
      updated_at: '2023-02-01'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    // Return a promise that doesn't resolve immediately to test loading state
    (judokaController.getAllJudokas as jest.Mock).mockReturnValue(new Promise(() => {}))
    
    render(<JudokaList />)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should render list of judokas', async () => {
    (judokaController.getAllJudokas as jest.Mock).mockResolvedValue({ success: true, data: mockJudokas })
    
    render(<JudokaList />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.getByText('Perez')).toBeInTheDocument()
      expect(screen.getByText('Maria')).toBeInTheDocument()
      expect(screen.getByText('Gomez')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Senior')).toBeInTheDocument()
    expect(screen.getByText('Negro')).toBeInTheDocument()
    expect(screen.getByText('81 kg')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('should render empty state when no judokas found', async () => {
    (judokaController.getAllJudokas as jest.Mock).mockResolvedValue({ success: true, data: [] })
    
    render(<JudokaList />)
    
    await waitFor(() => {
      expect(screen.getByText('No hay judokas registrados')).toBeInTheDocument()
    })
  })

  it('should render error message on failure', async () => {
    (judokaController.getAllJudokas as jest.Mock).mockResolvedValue({ success: false, error: 'Error fetching' })
    
    render(<JudokaList />)
    
    await waitFor(() => {
      expect(screen.getByText('Error fetching')).toBeInTheDocument()
    })
  })

  it('should filter by club when clubId is provided', async () => {
    (judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({ success: true, data: mockJudokas })
    
    render(<JudokaList clubId="club-1" />)
    
    await waitFor(() => {
      expect(judokaController.getJudokasByClub).toHaveBeenCalledWith('club-1')
    })
  })

  it('should filter by entrenador when entrenadorId is provided', async () => {
    (judokaController.getJudokasByEntrenador as jest.Mock).mockResolvedValue({ success: true, data: mockJudokas })
    
    render(<JudokaList entrenadorId="sensei-1" />)
    
    await waitFor(() => {
      expect(judokaController.getJudokasByEntrenador).toHaveBeenCalledWith('sensei-1')
    })
  })

  it('should call onEdit when edit button is clicked', async () => {
    (judokaController.getAllJudokas as jest.Mock).mockResolvedValue({ success: true, data: mockJudokas })
    const onEdit = jest.fn()
    
    render(<JudokaList onEdit={onEdit} />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })
    
    const editButtons = screen.getAllByTitle('Editar')
    fireEvent.click(editButtons[0])
    
    expect(onEdit).toHaveBeenCalledWith(mockJudokas[0])
  })

  it('should call onDelete when delete button is clicked', async () => {
    (judokaController.getAllJudokas as jest.Mock).mockResolvedValue({ success: true, data: mockJudokas })
    const onDelete = jest.fn()
    
    render(<JudokaList onDelete={onDelete} />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })
    
    const deleteButtons = screen.getAllByTitle('Eliminar')
    fireEvent.click(deleteButtons[0])
    
    expect(onDelete).toHaveBeenCalledWith(mockJudokas[0])
  })

  it('should reload data when refreshTrigger changes', async () => {
    (judokaController.getAllJudokas as jest.Mock).mockResolvedValue({ success: true, data: mockJudokas })
    
    const { rerender } = render(<JudokaList refreshTrigger={0} />)
    
    await waitFor(() => {
      expect(judokaController.getAllJudokas).toHaveBeenCalledTimes(1)
    })
    
    rerender(<JudokaList refreshTrigger={1} />)
    
    await waitFor(() => {
      expect(judokaController.getAllJudokas).toHaveBeenCalledTimes(2)
    })
  })
})
