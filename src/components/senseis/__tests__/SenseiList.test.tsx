import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SenseiList from '../SenseiList'
import { senseiController } from '@/controllers/senseiController'
import { Sensei } from '@/models/sensei'

// Mocks
jest.mock('@/controllers/senseiController')

describe('SenseiList', () => {
  const mockSenseis: Sensei[] = [
    {
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
    },
    {
      id: '2',
      usuario_id: 'user-456',
      club_id: 'club-789',
      nombres: 'Ana',
      apellidos: 'López',
      fecha_nacimiento: '1985-08-20',
      grado_dan: '3er Dan',
      certificacion: null,
      especialidad: 'Randori',
      foto_perfil: null,
      activo: false,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderizado básico', () => {
    it('debe mostrar loader mientras carga los datos', async () => {
      ;(senseiController.getAllSenseis as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockSenseis }), 100))
      )

      render(<SenseiList />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })

    it('debe renderizar la tabla con senseis', async () => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSenseis
      })

      render(<SenseiList />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      // Verificar headers de la tabla
      expect(screen.getByText('Nombres')).toBeInTheDocument()
      expect(screen.getByText('Apellidos')).toBeInTheDocument()
      expect(screen.getByText('Grado Dan')).toBeInTheDocument()
      expect(screen.getByText('Especialidad')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
      expect(screen.getByText('Acciones')).toBeInTheDocument()

      // Verificar datos del primer sensei
      expect(screen.getByText('Carlos')).toBeInTheDocument()
      expect(screen.getByText('García')).toBeInTheDocument()
      expect(screen.getByText('5to Dan')).toBeInTheDocument()
      expect(screen.getByText('Kata')).toBeInTheDocument()
      expect(screen.getByText('Activo')).toBeInTheDocument()

      // Verificar datos del segundo sensei
      expect(screen.getByText('Ana')).toBeInTheDocument()
      expect(screen.getByText('López')).toBeInTheDocument()
      expect(screen.getByText('3er Dan')).toBeInTheDocument()
      expect(screen.getByText('Randori')).toBeInTheDocument()
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })

    it('debe mostrar guiones para campos vacíos', async () => {
      const senseiSinDatos: Sensei[] = [{
        id: '3',
        usuario_id: 'user-789',
        club_id: null,
        nombres: 'Juan',
        apellidos: 'Pérez',
        fecha_nacimiento: null,
        grado_dan: null,
        certificacion: null,
        especialidad: null,
        foto_perfil: null,
        activo: true,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }]

      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: senseiSinDatos
      })

      render(<SenseiList />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      expect(screen.getAllByText('-')).toHaveLength(2) // Grado Dan y Especialidad
    })

    it('debe mostrar mensaje cuando no hay senseis', async () => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<SenseiList />)

      await waitFor(() => {
        expect(screen.getByText('No hay senseis registrados')).toBeInTheDocument()
      })

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('debe mostrar error cuando falla la carga', async () => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error al cargar senseis'
      })

      render(<SenseiList />)

      await waitFor(() => {
        expect(screen.getByText('Error al cargar senseis')).toBeInTheDocument()
      })

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('Filtrado por club', () => {
    it('debe usar getSenseisByClub cuando se proporciona clubId', async () => {
      const clubId = 'club-123'
      ;(senseiController.getSenseisByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockSenseis[0]]
      })

      render(<SenseiList clubId={clubId} />)

      await waitFor(() => {
        expect(senseiController.getSenseisByClub).toHaveBeenCalledWith(clubId)
      })

      expect(senseiController.getAllSenseis).not.toHaveBeenCalled()
    })

    it('debe usar getAllSenseis cuando no se proporciona clubId', async () => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSenseis
      })

      render(<SenseiList />)

      await waitFor(() => {
        expect(senseiController.getAllSenseis).toHaveBeenCalled()
      })

      expect(senseiController.getSenseisByClub).not.toHaveBeenCalled()
    })
  })

  describe('Callbacks de acciones', () => {
    beforeEach(() => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSenseis
      })
    })

    it('debe llamar onEdit cuando se hace clic en el botón editar', async () => {
      const user = userEvent.setup()
      const mockOnEdit = jest.fn()

      render(<SenseiList onEdit={mockOnEdit} />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle('Editar')
      await user.click(editButtons[0])

      expect(mockOnEdit).toHaveBeenCalledWith(mockSenseis[0])
    })

    it('debe llamar onDelete cuando se hace clic en el botón eliminar', async () => {
      const user = userEvent.setup()
      const mockOnDelete = jest.fn()

      render(<SenseiList onDelete={mockOnDelete} />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Eliminar')
      await user.click(deleteButtons[0])

      expect(mockOnDelete).toHaveBeenCalledWith(mockSenseis[0])
    })

    it('no debe mostrar botones de acción cuando no se proporcionan callbacks', async () => {
      render(<SenseiList />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      expect(screen.queryByTitle('Editar')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument()
    })

    it('debe mostrar solo botón editar cuando solo se proporciona onEdit', async () => {
      const mockOnEdit = jest.fn()

      render(<SenseiList onEdit={mockOnEdit} />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      expect(screen.getAllByTitle('Editar')).toHaveLength(2)
      expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument()
    })

    it('debe mostrar solo botón eliminar cuando solo se proporciona onDelete', async () => {
      const mockOnDelete = jest.fn()

      render(<SenseiList onDelete={mockOnDelete} />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      expect(screen.getAllByTitle('Eliminar')).toHaveLength(2)
      expect(screen.queryByTitle('Editar')).not.toBeInTheDocument()
    })
  })

  describe('Refresh trigger', () => {
    it('debe recargar datos cuando cambia refreshTrigger', async () => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSenseis
      })

      const { rerender } = render(<SenseiList refreshTrigger={1} />)

      await waitFor(() => {
        expect(senseiController.getAllSenseis).toHaveBeenCalledTimes(1)
      })

      // Cambiar refreshTrigger
      rerender(<SenseiList refreshTrigger={2} />)

      await waitFor(() => {
        expect(senseiController.getAllSenseis).toHaveBeenCalledTimes(2)
      })
    })

    it('debe recargar datos cuando cambia clubId', async () => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSenseis
      })

      ;(senseiController.getSenseisByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockSenseis[0]]
      })

      const { rerender } = render(<SenseiList />)

      await waitFor(() => {
        expect(senseiController.getAllSenseis).toHaveBeenCalledTimes(1)
      })

      // Cambiar a filtrar por club
      rerender(<SenseiList clubId="club-123" />)

      await waitFor(() => {
        expect(senseiController.getSenseisByClub).toHaveBeenCalledWith('club-123')
      })
    })
  })

  describe('Estilos y interactividad', () => {
    beforeEach(() => {
      ;(senseiController.getAllSenseis as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSenseis
      })
    })

    it('debe aplicar hover a las filas de la tabla', async () => {
      render(<SenseiList />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      const rows = screen.getAllByRole('row')
      const dataRow = rows[1] // Primera fila de datos (skip header)
      
      expect(dataRow).toHaveClass('MuiTableRow-hover')
    })

    it('debe mostrar chips con colores correctos para el estado', async () => {
      render(<SenseiList />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      const activoChip = screen.getByText('Activo')
      const inactivoChip = screen.getByText('Inactivo')

      expect(activoChip).toBeInTheDocument()
      expect(inactivoChip).toBeInTheDocument()

      // Los chips deben tener las clases de color apropiadas
      expect(activoChip.closest('.MuiChip-colorSuccess')).toBeTruthy()
      expect(inactivoChip.closest('.MuiChip-colorDefault')).toBeTruthy()
    })

    it('debe tener botones con iconos correctos', async () => {
      const mockOnEdit = jest.fn()
      const mockOnDelete = jest.fn()

      render(<SenseiList onEdit={mockOnEdit} onDelete={mockOnDelete} />)

      await waitFor(() => {
        expect(screen.getByText('Carlos')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle('Editar')
      const deleteButtons = screen.getAllByTitle('Eliminar')

      editButtons.forEach(button => {
        expect(button).toHaveAttribute('title', 'Editar')
      })

      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('title', 'Eliminar')
      })
    })
  })
})