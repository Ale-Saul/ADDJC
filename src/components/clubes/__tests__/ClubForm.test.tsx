
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClubForm from '../ClubForm'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { Club } from '@/models/club'
import { Sensei } from '@/models/sensei'

// Mocks
jest.mock('@/controllers/clubController')
jest.mock('@/controllers/senseiController')

const mockedClubController = clubController as jest.Mocked<typeof clubController>
const mockedSenseiController = senseiController as jest.Mocked<typeof senseiController>

const mockSenseis: Sensei[] = [
  {
    id: 's1',
    usuario_id: 'user-s1',
    nombres: 'Sensei',
    apellidos: 'Uno',
    club_id: 'c1',
    fecha_nacimiento: '1950-01-01',
    grado_dan: '5to Dan',
    certificacion: 'Nacional',
    especialidad: 'Kata',
    foto_perfil: null,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 's2',
    usuario_id: 'user-s2',
    nombres: 'Sensei',
    apellidos: 'Dos',
    club_id: 'c2',
    fecha_nacimiento: '1955-01-01',
    grado_dan: '3er Dan',
    certificacion: 'Regional',
    especialidad: 'Kumite',
    foto_perfil: null,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockClub: Club = {
  id: 'c1',
  nombre_club: 'Club Test',
  municipio: 'Testville',
  direccion: '123 Test St',
  telefono_contacto: '555-1234',
  director_tecnico_id: 'user-s1',
  activo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

describe('ClubForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedSenseiController.getAllSenseis.mockResolvedValue({ success: true, data: mockSenseis })
  })

  it('debe renderizar los campos para crear un club', async () => {
    render(<ClubForm />)

    // Check for the static fields first
    expect(screen.getByLabelText(/Nombre del Club/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Municipio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Dirección/i)).toBeInTheDocument()

    // Wait for the senseis to be loaded - check that the Select has options
    await waitFor(() => {
      expect(mockedSenseiController.getAllSenseis).toHaveBeenCalled()
    })

    // Click on the select to open it (there's only one combobox)
    const selectButton = screen.getByRole('combobox')
    await userEvent.click(selectButton)
    
    // Check that the options are present in the dropdown menu
    expect(await screen.findByText(/Sensei Uno/)).toBeInTheDocument()
    expect(screen.getByText(/Sensei Dos/)).toBeInTheDocument()
  })

  it('debe rellenar el formulario para editar un club', async () => {
    render(<ClubForm club={mockClub} />);
    
    expect(await screen.findByDisplayValue('Club Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Testville')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/Sensei Uno/)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument();
  });

  it('debe llamar a createClub al enviar el formulario', async () => {
    mockedClubController.createClub.mockResolvedValue({ success: true, data: mockClub })
    const onSuccess = jest.fn()
    render(<ClubForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/Nombre del Club/i), 'Nuevo Club')
    fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(mockedClubController.createClub).toHaveBeenCalledWith(
        expect.objectContaining({ nombre_club: 'Nuevo Club' })
      )
    });
    await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1)
    }, { timeout: 2000 });
  })

  it('debe llamar a updateClub al enviar el formulario de edición', async () => {
    mockedClubController.updateClub.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    render(<ClubForm club={mockClub} onSuccess={onSuccess} />)

    await userEvent.clear(screen.getByLabelText(/Nombre del Club/i))
    await userEvent.type(screen.getByLabelText(/Nombre del Club/i), 'Club Modificado')
    fireEvent.submit(screen.getByRole('button', { name: /Actualizar/i }))

    await waitFor(() => {
      expect(mockedClubController.updateClub).toHaveBeenCalledWith(
        mockClub.id,
        expect.objectContaining({ nombre_club: 'Club Modificado' })
      )
    });
    await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1)
    }, { timeout: 2000 });
  })

  it('debe crear un nuevo sensei si se proporcionan los campos y no se selecciona uno existente', async () => {
    const newSensei = { ...mockSenseis[0], id: 's2', usuario_id: 'user-s2', nombres: 'Nuevo', apellidos: 'Sensei' }
    mockedSenseiController.createSensei.mockResolvedValue({ success: true, data: newSensei })
    mockedClubController.createClub.mockResolvedValue({ success: true, data: { ...mockClub, id: 'c2' } })
    mockedSenseiController.updateSensei.mockResolvedValue({ success: true })

    render(<ClubForm />)
    
    await userEvent.type(screen.getByLabelText(/Nombre del Club/i), 'Club con Nuevo Sensei')
    await userEvent.type(screen.getByLabelText(/Nombre del Director Técnico/i), 'Nuevo')
    await userEvent.type(screen.getByLabelText(/Apellidos del Director Técnico/i), 'Sensei')

    fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(mockedSenseiController.createSensei).toHaveBeenCalledWith(
        expect.objectContaining({ nombres: 'Nuevo', apellidos: 'Sensei' })
      )
      expect(mockedClubController.createClub).toHaveBeenCalledWith(
        expect.objectContaining({ director_tecnico_id: newSensei.usuario_id })
      )
      expect(mockedSenseiController.updateSensei).toHaveBeenCalledWith(
        newSensei.id,
        { club_id: 'c2' }
      )
    })
  })

  it('debe mostrar un error si la creación del club falla', async () => {
    mockedClubController.createClub.mockResolvedValue({ success: false, error: 'Error de base de datos' })
    render(<ClubForm />)
    
    await userEvent.type(screen.getByLabelText(/Nombre del Club/i), 'Club Fallido')
    fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

    expect(await screen.findByText('Error de base de datos')).toBeInTheDocument()
  })
})
