
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ArbitroList from '../ArbitroList'
import { arbitroController } from '@/controllers/arbitroController'
import { Arbitro } from '@/models/arbitro'

// Mock del controlador
jest.mock('@/controllers/arbitroController')
const mockedArbitroController = arbitroController as jest.Mocked<typeof arbitroController>

const mockArbitros: Arbitro[] = [
  {
    id: '1',
    nombres: 'Juan',
    apellidos: 'Perez',
    nivel_arbitraje: 'Nacional',
    activo: true,
    usuario_id: 'user-1',
    fecha_nacimiento: '1985-10-20',
    certificacion: null,
    foto_perfil: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    nombres: 'Ana',
    apellidos: 'Gomez',
    nivel_arbitraje: 'Regional',
    activo: false,
    usuario_id: 'user-2',
    fecha_nacimiento: '1990-05-15',
    certificacion: null,
    foto_perfil: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

describe('ArbitroList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debe mostrar un loader mientras se cargan los datos', () => {
    mockedArbitroController.getAllArbitros.mockResolvedValue({ success: true, data: [] })
    render(<ArbitroList />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('debe mostrar un mensaje de error si la carga de datos falla', async () => {
    const errorMessage = 'Error al cargar los árbitros'
    mockedArbitroController.getAllArbitros.mockResolvedValue({ success: false, error: errorMessage })
    render(<ArbitroList />)
    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })

  it('debe mostrar un mensaje cuando no hay árbitros registrados', async () => {
    mockedArbitroController.getAllArbitros.mockResolvedValue({ success: true, data: [] })
    render(<ArbitroList />)
    expect(await screen.findByText('No hay árbitros registrados')).toBeInTheDocument()
  })

  it('debe renderizar la lista de árbitros correctamente', async () => {
    mockedArbitroController.getAllArbitros.mockResolvedValue({ success: true, data: mockArbitros })
    render(<ArbitroList />)

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.getByText('Perez')).toBeInTheDocument()
      expect(screen.getByText('Nacional')).toBeInTheDocument()
      expect(screen.getByText('Activo')).toBeInTheDocument()

      expect(screen.getByText('Ana')).toBeInTheDocument()
      expect(screen.getByText('Gomez')).toBeInTheDocument()
      expect(screen.getByText('Regional')).toBeInTheDocument()
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  it('debe llamar a onEdit cuando se hace clic en el botón de editar', async () => {
    const handleEdit = jest.fn()
    mockedArbitroController.getAllArbitros.mockResolvedValue({ success: true, data: mockArbitros })
    render(<ArbitroList onEdit={handleEdit} />)

    await waitFor(() => {
      const editButtons = screen.getAllByTitle('Editar')
      fireEvent.click(editButtons[0])
      expect(handleEdit).toHaveBeenCalledWith(mockArbitros[0])
    })
  })

  it('debe llamar a onDelete cuando se hace clic en el botón de eliminar', async () => {
    const handleDelete = jest.fn()
    mockedArbitroController.getAllArbitros.mockResolvedValue({ success: true, data: mockArbitros })
    render(<ArbitroList onDelete={handleDelete} />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Eliminar')
      fireEvent.click(deleteButtons[0])
      expect(handleDelete).toHaveBeenCalledWith(mockArbitros[0])
    })
  })

  it('debe volver a cargar los datos cuando refreshTrigger cambia', async () => {
    mockedArbitroController.getAllArbitros.mockResolvedValueOnce({ success: true, data: [mockArbitros[0]] })
    const { rerender } = render(<ArbitroList refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.queryByText('Ana')).not.toBeInTheDocument()
    })

    mockedArbitroController.getAllArbitros.mockResolvedValueOnce({ success: true, data: mockArbitros })
    rerender(<ArbitroList refreshTrigger={1} />)

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.getByText('Ana')).toBeInTheDocument()
    })

    expect(mockedArbitroController.getAllArbitros).toHaveBeenCalledTimes(2)
  })
})
