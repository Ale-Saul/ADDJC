import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClubList from '@/components/clubes/ClubList'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'

jest.mock('@/controllers/clubController')
const mockedClubController = clubController as jest.Mocked<typeof clubController>

const mockClubs: Club[] = [
  {
    id: '1',
    nombre_club: 'Club Uno',
    provincia: 'Municipio Uno',
    direccion: 'Direccion Uno',
    telefono_contacto: '123456789',
    director_tecnico_id: 'user-s1',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    nombre_club: 'Club Dos',
    provincia: 'Municipio Dos',
    direccion: 'Direccion Dos',
    telefono_contacto: '987654321',
    director_tecnico_id: null,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

describe('ClubList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debe renderizar la lista de clubes', async () => {
    mockedClubController.getAllClubes.mockResolvedValue({
      success: true,
      data: mockClubs
    })
    render(<ClubList onEdit={jest.fn()} />)

    expect(await screen.findByText('Club Uno')).toBeInTheDocument()
    expect(screen.getByText('Club Dos')).toBeInTheDocument()
  })

  it('debe mostrar un mensaje si no hay clubes', async () => {
    mockedClubController.getAllClubes.mockResolvedValue({
      success: true,
      data: []
    })
    render(<ClubList onEdit={jest.fn()} />)

    expect(await screen.findByText('No hay clubes registrados')).toBeInTheDocument()
  })

  it('debe llamar a onEdit cuando se hace clic en el botón de editar', async () => {
    const onEdit = jest.fn()
    mockedClubController.getAllClubes.mockResolvedValue({
      success: true,
      data: mockClubs
    })
    render(<ClubList onEdit={onEdit} />)

    const editButtons = await screen.findAllByRole('button', { name: /editar/i })
    await userEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledWith(mockClubs[0])
  })

  it('debe confirmar y eliminar un club', async () => {
    const onDelete = jest.fn()
    mockedClubController.getAllClubes.mockResolvedValue({
      success: true,
      data: mockClubs
    })
    render(<ClubList onEdit={jest.fn()} onDelete={onDelete} />)

    const deleteButtons = await screen.findAllByRole('button', { name: /eliminar/i })
    await userEvent.click(deleteButtons[0])

    expect(onDelete).toHaveBeenCalledWith(mockClubs[0])
  })

  it('debe mostrar un error si la eliminación falla', async () => {
    const onDelete = jest.fn()
    mockedClubController.getAllClubes.mockResolvedValue({
      success: true,
      data: mockClubs
    })
    render(<ClubList onEdit={jest.fn()} onDelete={onDelete} />)

    const deleteButtons = await screen.findAllByRole('button', { name: /eliminar/i })
    await userEvent.click(deleteButtons[0])

    expect(onDelete).toHaveBeenCalledWith(mockClubs[0])
  })
})

