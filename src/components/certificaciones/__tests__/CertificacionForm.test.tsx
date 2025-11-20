import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CertificacionForm from '../CertificacionForm'
import { certificacionController } from '@/controllers/certificacionController'
import { storageService } from '@/services/storageService'
import { Certificacion } from '@/models/certificacion'

// Mock de los controladores y servicios
jest.mock('@/controllers/certificacionController')
jest.mock('@/services/storageService')

const mockedController = certificacionController as jest.Mocked<typeof certificacionController>
const mockedStorage = storageService as jest.Mocked<typeof storageService>

// Mock de FileReader
class MockFileReader {
  result: string | null = null
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null

  readAsDataURL() {
    // Simular que la lectura se completó
    setTimeout(() => {
      this.result = 'data:image/png;base64,mockedData'
      if (this.onloadend) {
        this.onloadend.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>)
      }
    }, 0)
  }
}

global.FileReader = MockFileReader as unknown as typeof FileReader

describe('CertificacionForm', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()
  const usuarioId = 'user-123'
  const tipoAfiliado = 'sensei' as const

  const mockCertificacion: Certificacion = {
    id: 'cert-123',
    usuario_id: usuarioId,
    tipo_afiliado: 'sensei',
    nombre_certificacion: 'Certificación Nacional',
    descripcion: 'Descripción de prueba',
    fecha_emision: '2024-01-15',
    fecha_vencimiento: '2025-01-15',
    archivo_url: 'https://example.com/cert.pdf',
    activo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Modo creación', () => {
    it('debe renderizar el formulario para crear certificación', () => {
      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/Nombre de la Certificación/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha de Emisión/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha de Vencimiento/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Crear/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    })

    it('debe crear una certificación exitosamente', async () => {
      mockedController.createCertificacion.mockResolvedValue({
        success: true,
        data: mockCertificacion
      })

      const localMockOnSuccess = jest.fn()

      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
          onSuccess={localMockOnSuccess}
        />
      )

      await userEvent.type(screen.getByLabelText(/Nombre de la Certificación/i), 'Certificación Test')
      await userEvent.type(screen.getByLabelText(/Descripción/i), 'Descripción Test')

      fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

      await waitFor(() => {
        expect(mockedController.createCertificacion).toHaveBeenCalledWith(
          expect.objectContaining({
            usuario_id: usuarioId,
            tipo_afiliado: tipoAfiliado,
            nombre_certificacion: 'Certificación Test',
            descripcion: 'Descripción Test',
            activo: true
          })
        )
      })

      expect(await screen.findByText(/Certificación creada exitosamente/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(localMockOnSuccess).toHaveBeenCalled()
      }, { timeout: 3000 })
    }, 10000)

    it('debe mostrar error al crear certificación', async () => {
      mockedController.createCertificacion.mockResolvedValue({
        success: false,
        error: 'Error al crear certificación'
      })

      const localMockOnSuccess = jest.fn()

      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
          onSuccess={localMockOnSuccess}
        />
      )

      await userEvent.type(screen.getByLabelText(/Nombre de la Certificación/i), 'Certificación Test')

      fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

      expect(await screen.findByText(/Error al crear certificación/i)).toBeInTheDocument()
      
      // Esperar un poco para asegurarse de que onSuccess no se llama
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(localMockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Modo edición', () => {
    it('debe cargar los datos de la certificación existente', () => {
      render(
        <CertificacionForm
          certificacion={mockCertificacion}
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
        />
      )

      expect(screen.getByDisplayValue('Certificación Nacional')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Descripción de prueba')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument()
    })

    it('debe actualizar una certificación exitosamente', async () => {
      mockedController.updateCertificacion.mockResolvedValue({
        success: true,
        data: { ...mockCertificacion, nombre_certificacion: 'Certificación Actualizada' }
      })

      render(
        <CertificacionForm
          certificacion={mockCertificacion}
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
          onSuccess={mockOnSuccess}
        />
      )

      const nombreInput = screen.getByLabelText(/Nombre de la Certificación/i)
      await userEvent.clear(nombreInput)
      await userEvent.type(nombreInput, 'Certificación Actualizada')

      fireEvent.submit(screen.getByRole('button', { name: /Actualizar/i }))

      await waitFor(() => {
        expect(mockedController.updateCertificacion).toHaveBeenCalledWith(
          mockCertificacion.id,
          expect.objectContaining({
            nombre_certificacion: 'Certificación Actualizada'
          })
        )
      })

      expect(await screen.findByText(/Certificación actualizada exitosamente/i)).toBeInTheDocument()
    })
  })

  describe('Subida de archivos', () => {
    it('debe rechazar archivos con tipo no permitido', async () => {
      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
        />
      )

      const file = new File(['contenido'], 'test.txt', { type: 'text/plain' })
      
      // Buscar el input de archivo escondido
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = fileInputs[0] as HTMLInputElement

      // Simular el cambio de archivo
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })
      
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/Tipo de archivo no permitido/i)).toBeInTheDocument()
      })
    })

    it('debe rechazar archivos que excedan el tamaño máximo', async () => {
      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
        />
      )

      // Crear un archivo de más de 10MB
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
      
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = fileInputs[0] as HTMLInputElement

      await userEvent.upload(fileInput, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/El archivo es demasiado grande/i)).toBeInTheDocument()
      })
    })

    it('debe subir archivo correctamente al crear certificación', async () => {
      mockedStorage.uploadFile.mockResolvedValue({
        success: true,
        url: 'https://storage.example.com/cert.pdf'
      })

      mockedController.createCertificacion.mockResolvedValue({
        success: true,
        data: mockCertificacion
      })

      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
        />
      )

      await userEvent.type(screen.getByLabelText(/Nombre de la Certificación/i), 'Certificación con Archivo')

      const file = new File(['contenido'], 'certificado.pdf', { type: 'application/pdf' })
      
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = fileInputs[0] as HTMLInputElement

      await userEvent.upload(fileInput, file)

      fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

      await waitFor(() => {
        expect(mockedStorage.uploadFile).toHaveBeenCalledWith(
          file,
          'certificaciones',
          expect.stringContaining(`certificaciones/${tipoAfiliado}`)
        )
      })

      await waitFor(() => {
        expect(mockedController.createCertificacion).toHaveBeenCalledWith(
          expect.objectContaining({
            archivo_url: 'https://storage.example.com/cert.pdf'
          })
        )
      })
    })

    it('debe mostrar error si falla la subida del archivo', async () => {
      mockedStorage.uploadFile.mockResolvedValue({
        success: false,
        error: 'Error al subir archivo'
      })

      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
        />
      )

      await userEvent.type(screen.getByLabelText(/Nombre de la Certificación/i), 'Certificación Test')

      const file = new File(['contenido'], 'certificado.pdf', { type: 'application/pdf' })
      
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = fileInputs[0] as HTMLInputElement

      await userEvent.upload(fileInput, file)

      fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

      expect(await screen.findByText(/Error al subir archivo/i)).toBeInTheDocument()
      expect(mockedController.createCertificacion).not.toHaveBeenCalled()
    })
  })

  describe('Cambio de estado', () => {
    it('debe permitir cambiar el estado de la certificación', async () => {
      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
        />
      )

      // Buscar el select por su rol combobox (sin nombre accesible en modo creación)
      const estadoSelect = screen.getByRole('combobox')
      
      // Abrir el select
      await userEvent.click(estadoSelect)
      
      // Seleccionar "Inactiva"
      const inactivaOption = await screen.findByText('Inactiva')
      await userEvent.click(inactivaOption)

      // Verificar que el select ahora muestra "Inactiva"
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Inactiva')
      })
    })
  })

  describe('Botones de acción', () => {
    it('debe llamar a onCancel cuando se presiona el botón cancelar', async () => {
      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
          onCancel={mockOnCancel}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }))

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('debe deshabilitar botones durante la carga', async () => {
      mockedController.createCertificacion.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockCertificacion }), 100))
      )

      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
          onCancel={mockOnCancel}
        />
      )

      await userEvent.type(screen.getByLabelText(/Nombre de la Certificación/i), 'Test')

      fireEvent.submit(screen.getByRole('button', { name: /Crear/i }))

      // Durante la carga, los botones deben estar deshabilitados
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Guardando/i })).toBeDisabled()
      })
    })
  })

  describe('Validación de campos requeridos', () => {
    it('debe requerir el nombre de la certificación', async () => {
      render(
        <CertificacionForm
          usuarioId={usuarioId}
          tipoAfiliado={tipoAfiliado}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Crear/i })
      fireEvent.click(submitButton)

      // HTML5 validation debería prevenir el envío
      expect(mockedController.createCertificacion).not.toHaveBeenCalled()
    })
  })
})
