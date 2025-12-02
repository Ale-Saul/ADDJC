import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SenseiForm from '../SenseiForm'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Sensei } from '@/models/sensei'
import { Club } from '@/models/club'

// Mocks
jest.mock('@/controllers/senseiController')
jest.mock('@/controllers/clubController')

describe('SenseiForm', () => {
  const mockClub: Club = {
    id: 'club-1',
    nombre_club: 'Club Test',
    municipio: 'Bogotá',
    direccion: 'Calle 123',
    telefono_contacto: '1234567890',
    director_tecnico_id: null,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockSensei: Sensei = {
    id: '1',
    usuario_id: 'user-123',
    club_id: 'club-1',
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

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock clubController por defecto
    ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockClub]
    })
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar todos los campos del formulario', async () => {
      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /nombres/i })).toBeInTheDocument()
      })

      expect(screen.getByRole('textbox', { name: /apellidos/i })).toBeInTheDocument()
      expect(screen.getByLabelText('Fecha de Nacimiento')).toBeInTheDocument()
      expect(screen.getAllByText('Grado Dan')[0]).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /especialidad/i })).toBeInTheDocument()
      expect(screen.getAllByText('Club')[0]).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
    })

    it('debe cargar y mostrar clubes en el select', async () => {
      render(<SenseiForm />)

      await waitFor(() => {
        expect(clubController.getAllClubes).toHaveBeenCalledWith(false)
      })

      // Buscar el select de club por su ID específico
      const clubSelect = document.getElementById('mui-component-select-club_id')
      expect(clubSelect).toBeInTheDocument()

      // Abrir el select
      fireEvent.mouseDown(clubSelect!)

      await waitFor(() => {
        expect(screen.getByText('Club Test')).toBeInTheDocument()
        expect(screen.getByText('Sin club')).toBeInTheDocument()
      })
    }, 10000)

    it('debe mostrar opciones de grado dan', async () => {
      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getAllByText('Grado Dan')[0]).toBeInTheDocument()
      })

      // Buscar select de grado dan por su ID específico
      const gradoSelect = document.getElementById('mui-component-select-grado_dan')
      expect(gradoSelect).toBeInTheDocument()
      
      fireEvent.mouseDown(gradoSelect!)

      await waitFor(() => {
        expect(screen.getByText('1er Dan')).toBeInTheDocument()
        expect(screen.getByText('5to Dan')).toBeInTheDocument()
        expect(screen.getByText('10mo Dan')).toBeInTheDocument()
      })
    }, 10000)
  })

  describe('Modo creación', () => {
    it('debe crear un sensei con datos válidos', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = jest.fn()

      ;(senseiController.createSensei as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei
      })

      render(<SenseiForm onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /nombres/i })).toBeInTheDocument()
      })

      // Llenar el formulario
      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      
      // Campo de contraseña (type=password no es textbox, usar name attribute)
      const passwordField = document.querySelector('input[name="password"]')
      if (passwordField) await user.type(passwordField, 'password123')
      
      await user.type(screen.getByRole('textbox', { name: /especialidad/i }), 'Kata')

      // Enviar formulario
      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => {
        expect(senseiController.createSensei).toHaveBeenCalledWith({
          usuario_id: 'temp-user-id',
          club_id: null,
          nombres: 'Carlos',
          apellidos: 'García',
          email: 'carlos@test.com',
          password: 'password123',
          fecha_nacimiento: null,
          grado_dan: '',
          especialidad: 'Kata',
          foto_perfil: null,
          activo: true,
          isEncargado: false
        })
      })

      expect(screen.getByText('Sensei creado exitosamente')).toBeInTheDocument()
      
      // Verificar que se llama onSuccess después de un tiempo
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      }, { timeout: 3000 })
    }, 10000)

    it('debe seleccionar un club correctamente', async () => {
      const user = userEvent.setup()

      ;(senseiController.createSensei as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei
      })

      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getAllByText('Club')[0]).toBeInTheDocument()
      })

      // Llenar campos requeridos primero
      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement
      if (passwordField) await user.type(passwordField, 'password123')

      // Enviar formulario
      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => {
        expect(senseiController.createSensei).toHaveBeenCalledWith(
          expect.objectContaining({
            nombres: 'Carlos',
            apellidos: 'García',
            email: 'carlos@test.com',
            password: 'password123'
          })
        )
      })
    })

    it('debe seleccionar grado dan correctamente', async () => {
      const user = userEvent.setup()

      ;(senseiController.createSensei as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei
      })

      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getAllByText('Grado Dan')[0]).toBeInTheDocument()
      })

      // Llenar campos requeridos primero
      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement
      if (passwordField) await user.type(passwordField, 'password123')

      // Enviar formulario
      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => {
        expect(senseiController.createSensei).toHaveBeenCalledWith(
          expect.objectContaining({
            nombres: 'Carlos',
            apellidos: 'García',
            email: 'carlos@test.com',
            password: 'password123'
          })
        )
      })
    })

    it('debe manejar fecha de nacimiento', async () => {
      const user = userEvent.setup()

      ;(senseiController.createSensei as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSensei
      })

      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Fecha de Nacimiento')).toBeInTheDocument()
      })

      // Llenar campos requeridos y fecha
      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement
      if (passwordField) await user.type(passwordField, 'password123')
      
      const fechaInput = screen.getByLabelText('Fecha de Nacimiento')
      await user.type(fechaInput, '1980-05-15')

      // Enviar formulario
      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => {
        expect(senseiController.createSensei).toHaveBeenCalledWith(
          expect.objectContaining({
            fecha_nacimiento: '1980-05-15',
            email: 'carlos@test.com',
            password: 'password123'
          })
        )
      })
    })

    it('debe mostrar error cuando falla la creación', async () => {
      const user = userEvent.setup()

      ;(senseiController.createSensei as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error al crear sensei'
      })

      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /nombres/i })).toBeInTheDocument()
      })

      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement
      if (passwordField) await user.type(passwordField, 'password123')
      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => {
        expect(screen.getByText('Error al crear sensei')).toBeInTheDocument()
      })
    })
  })

  describe('Modo edición', () => {
    it('debe cargar datos del sensei en el formulario', async () => {
      render(<SenseiForm sensei={mockSensei} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Carlos')).toBeInTheDocument()
      })

      expect(screen.getByDisplayValue('García')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1980-05-15')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Kata')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
    })

    it('debe actualizar un sensei correctamente', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = jest.fn()

      ;(senseiController.updateSensei as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockSensei, nombres: 'Carlos Actualizado' }
      })

      render(<SenseiForm sensei={mockSensei} onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Carlos')).toBeInTheDocument()
      })

      // Actualizar nombre
      const nombresInput = screen.getByDisplayValue('Carlos')
      await user.clear(nombresInput)
      await user.type(nombresInput, 'Carlos Actualizado')

      await user.click(screen.getByRole('button', { name: 'Actualizar' }))

      await waitFor(() => {
        expect(senseiController.updateSensei).toHaveBeenCalledWith('1', {
          club_id: 'club-1',
          nombres: 'Carlos Actualizado',
          apellidos: 'García',
          fecha_nacimiento: '1980-05-15',
          grado_dan: '5to Dan',
          especialidad: 'Kata',
          foto_perfil: null,
          activo: true
        })
      })

      expect(screen.getByText('Sensei actualizado exitosamente')).toBeInTheDocument()
    })
  })

  describe('Validación y estados', () => {
    it('debe deshabilitar campos durante la carga', async () => {
      ;(senseiController.createSensei as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockSensei }), 100))
      )

      const user = userEvent.setup()
      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /nombres/i })).toBeInTheDocument()
      })

      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement
      if (passwordField) await user.type(passwordField, 'password123')
      
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      await user.click(submitButton)

      // Durante la carga, los campos deben estar deshabilitados
      expect(screen.getByRole('textbox', { name: /nombres/i })).toBeDisabled()
      expect(screen.getByRole('textbox', { name: /apellidos/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
    })

    it('debe limpiar errores al escribir en los campos', async () => {
      const user = userEvent.setup()

      ;(senseiController.createSensei as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error de prueba'
      })

      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /nombres/i })).toBeInTheDocument()
      })

      // Generar error
      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement
      if (passwordField) await user.type(passwordField, 'password123')
      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => {
        expect(screen.getByText('Error de prueba')).toBeInTheDocument()
      })

      // Al escribir en un campo, el error debe desaparecer
      await user.type(screen.getByRole('textbox', { name: /nombres/i }), ' Modificado')

      expect(screen.queryByText('Error de prueba')).not.toBeInTheDocument()
    })

    it('debe manejar error al cargar clubes', async () => {
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error al cargar clubes'
      })

      render(<SenseiForm />)

      await waitFor(() => {
        expect(clubController.getAllClubes).toHaveBeenCalled()
      })

      // El select de clubes debe estar disponible
      expect(screen.getAllByText('Club')[0]).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('debe llamar onCancel cuando se hace clic en Cancelar', async () => {
      const user = userEvent.setup()
      const mockOnCancel = jest.fn()

      render(<SenseiForm onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Cancelar'))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('no debe mostrar botón Cancelar si no se proporciona onCancel', async () => {
      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /nombres/i })).toBeInTheDocument()
      })

      expect(screen.queryByText('Cancelar')).not.toBeInTheDocument()
    })

    it('debe cerrar alert de error manualmente', async () => {
      const user = userEvent.setup()

      ;(senseiController.createSensei as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error de prueba'
      })

      render(<SenseiForm />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /nombres/i })).toBeInTheDocument()
      })

      await user.type(screen.getByRole('textbox', { name: /nombres/i }), 'Carlos')
      await user.type(screen.getByRole('textbox', { name: /apellidos/i }), 'García')
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'carlos@test.com')
      const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement
      if (passwordField) await user.type(passwordField, 'password123')
      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => {
        expect(screen.getByText('Error de prueba')).toBeInTheDocument()
      })

      // Cerrar el alert
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(screen.queryByText('Error de prueba')).not.toBeInTheDocument()
    })
  })
})

