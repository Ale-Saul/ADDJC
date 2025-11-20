import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JudokaForm from '../JudokaForm'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'

// Mocks
jest.mock('@/controllers/judokaController')
jest.mock('@/controllers/clubController')
jest.mock('@/controllers/senseiController')

describe('JudokaForm', () => {
  const mockClubes = [
    { id: 'club-1', nombre_club: 'Club A', activo: true },
    { id: 'club-2', nombre_club: 'Club B', activo: true }
  ]

  const mockSenseis = [
    { id: 'sensei-1', usuario_id: 'user-sensei-1', nombres: 'Sensei', apellidos: 'Uno', club_id: 'club-1', activo: true }
  ]

  const mockJudoka = {
    id: '1',
    usuario_id: 'user-1',
    club_id: 'club-1',
    entrenador_id: 'user-sensei-1',
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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({ success: true, data: mockClubes })
    ;(senseiController.getSenseisByClub as jest.Mock).mockResolvedValue({ success: true, data: mockSenseis })
  })

  it('should render form fields correctly', async () => {
    render(<JudokaForm />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Nombres/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Apellidos/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha de Nacimiento/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Peso Competitivo/i)).toBeInTheDocument()
    })
  })

  it('should load clubs on mount', async () => {
    render(<JudokaForm />)

    await waitFor(() => {
      expect(clubController.getAllClubes).toHaveBeenCalledWith(false)
    })
  })

  it('should load senseis when club is selected', async () => {
    render(<JudokaForm />)

    // Wait for clubs to load
    await waitFor(() => expect(clubController.getAllClubes).toHaveBeenCalled())

    // Select a club
    // MUI Select structure makes it hard to query by label name directly in some versions
    // Club is the first select in the form
    const comboboxes = screen.getAllByRole('combobox')
    const clubSelect = comboboxes[0]
    
    fireEvent.mouseDown(clubSelect)
    
    const clubOption = await screen.findByText('Club A')
    fireEvent.click(clubOption)

    await waitFor(() => {
      expect(senseiController.getSenseisByClub).toHaveBeenCalledWith('club-1')
    })
  })

  it('should submit form with valid data for creation', async () => {
    (judokaController.createJudoka as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
    const onSuccess = jest.fn()

    render(<JudokaForm onSuccess={onSuccess} />)

    // Fill text fields
    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'Nuevo' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/i), { target: { value: 'Judoka' } })
    fireEvent.change(screen.getByLabelText(/Fecha de Nacimiento/i), { target: { value: '2000-01-01' } })

    // Submit
    const submitButton = screen.getByRole('button', { name: /Crear/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(judokaController.createJudoka).toHaveBeenCalledWith(expect.objectContaining({
        nombres: 'Nuevo',
        apellidos: 'Judoka',
        fecha_nacimiento: '2000-01-01'
      }))
    })
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should populate form with existing judoka data', async () => {
    render(<JudokaForm judoka={mockJudoka} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Perez')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('81')).toBeInTheDocument()
    })
  })

  it('should submit form for update', async () => {
    (judokaController.updateJudoka as jest.Mock).mockResolvedValue({ success: true, data: mockJudoka })
    const onSuccess = jest.fn()

    render(<JudokaForm judoka={mockJudoka} onSuccess={onSuccess} />)

    // Change a field
    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'Juan Updated' } })

    // Submit
    const updateButton = screen.getByRole('button', { name: /Actualizar/i })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(judokaController.updateJudoka).toHaveBeenCalledWith('1', expect.objectContaining({
        nombres: 'Juan Updated'
      }))
    })
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should show error message on failure', async () => {
    (judokaController.createJudoka as jest.Mock).mockResolvedValue({ success: false, error: 'Error creating' })
    
    render(<JudokaForm />)

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Nombres/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/Fecha de Nacimiento/i), { target: { value: '2000-01-01' } })

    fireEvent.click(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(screen.getByText('Error creating')).toBeInTheDocument()
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const onCancel = jest.fn()
    render(<JudokaForm onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(onCancel).toHaveBeenCalled()
  })
})
