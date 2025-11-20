
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArbitroForm from '../ArbitroForm'
import { arbitroController } from '@/controllers/arbitroController'
import { Arbitro } from '@/models/arbitro'

// Mock del controlador
jest.mock('@/controllers/arbitroController')
const mockedArbitroController = arbitroController as jest.Mocked<typeof arbitroController>

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

describe('ArbitroForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debe renderizar los campos del formulario para crear un nuevo árbitro', () => {
    render(<ArbitroForm />)
    expect(screen.getByLabelText(/Nombres/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Apellidos/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha de Nacimiento/i)).toBeInTheDocument()
    // The Select component label is tricky, we get the component by its role
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear/i })).toBeInTheDocument()
  })

  it('debe rellenar el formulario con los datos del árbitro cuando se proporciona para editar', () => {
    render(<ArbitroForm arbitro={mockArbitro} />)
    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Perez')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1985-10-20')).toBeInTheDocument()
    // Para el Select, el valor se verifica de manera diferente
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('Nacional')
    expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument()
  })

  it('debe llamar a createArbitro al enviar el formulario para un nuevo árbitro', async () => {
    mockedArbitroController.createArbitro.mockResolvedValue({ success: true, data: { ...mockArbitro, id: 'new-id', nombres: 'Nuevo', apellidos: 'Arbitro' } })
    const onSuccess = jest.fn()
    render(<ArbitroForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/Nombres/i), 'Nuevo')
    await userEvent.type(screen.getByLabelText(/Apellidos/i), 'Arbitro')
    
    fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(mockedArbitroController.createArbitro).toHaveBeenCalledWith(
        expect.objectContaining({
          nombres: 'Nuevo',
          apellidos: 'Arbitro'
        })
      )
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    }, { timeout: 2000 })
  })

  it('debe llamar a updateArbitro al enviar el formulario para editar un árbitro', async () => {
    mockedArbitroController.updateArbitro.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    render(<ArbitroForm arbitro={mockArbitro} onSuccess={onSuccess} />)

    await userEvent.clear(screen.getByLabelText(/Nombres/i))
    await userEvent.type(screen.getByLabelText(/Nombres/i), 'Juan Modificado')

    fireEvent.submit(screen.getByRole('button', { name: /Actualizar/i }))

    await waitFor(() => {
      expect(mockedArbitroController.updateArbitro).toHaveBeenCalledWith(
        mockArbitro.id,
        expect.objectContaining({
          nombres: 'Juan Modificado'
        })
      )
    })
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    }, { timeout: 2000 })
  })

  it('debe mostrar un mensaje de error si la creación falla', async () => {
    const errorMessage = 'Error de red'
    mockedArbitroController.createArbitro.mockResolvedValue({ success: false, error: errorMessage })
    render(<ArbitroForm />)

    await userEvent.type(screen.getByLabelText(/Nombres/i), 'Test')
    await userEvent.type(screen.getByLabelText(/Apellidos/i), 'Error')
    
    fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })

  it('debe mostrar un mensaje de error si la actualización falla', async () => {
    const errorMessage = 'No se pudo actualizar'
    mockedArbitroController.updateArbitro.mockResolvedValue({ success: false, error: errorMessage })
    render(<ArbitroForm arbitro={mockArbitro} />)

    fireEvent.submit(screen.getByRole('button', { name: /Actualizar/i }))

    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })

  it('debe llamar a onCancel cuando se hace clic en el botón Cancelar', () => {
    const handleCancel = jest.fn()
    render(<ArbitroForm onCancel={handleCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('debe actualizar el estado del nivel de arbitraje al cambiar el select', async () => {
    render(<ArbitroForm />)
    const select = screen.getAllByRole('combobox')[0]
    
    // Abrir el select
    fireEvent.mouseDown(select)
    
    // Seleccionar una opción
    const option = await screen.findByRole('option', { name: 'Regional' })
    fireEvent.click(option)

    await waitFor(() => {
      expect(select).toHaveTextContent('Regional')
    })
  })
})
