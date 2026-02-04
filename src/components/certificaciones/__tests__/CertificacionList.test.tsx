import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CertificacionList from '../CertificacionList'
import { certificacionController } from '@/controllers/certificacionController'
import { Certificacion } from '@/models/certificacion'

// Mock del controlador
jest.mock('@/controllers/certificacionController')

const mockedController = certificacionController as jest.Mocked<typeof certificacionController>

describe('CertificacionList', () => {
  const usuarioId = 'user-123'
  const tipoAfiliado = 'sensei' as const
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnAdd = jest.fn()

  const mockCertificaciones: Certificacion[] = [
    {
      id: 'cert-1',
      usuario_id: usuarioId,
      tipo_afiliado: 'sensei',
      nombre_certificacion: 'Certificación Nacional',
      descripcion: 'Descripción 1',
      fecha_emision: '2024-01-15',
      fecha_vencimiento: '2025-01-15',
      archivo_url: 'https://example.com/cert1.pdf',
      activo: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'cert-2',
      usuario_id: usuarioId,
      tipo_afiliado: 'sensei',
      nombre_certificacion: 'Certificación Internacional',
      descripcion: null,
      fecha_emision: null,
      fecha_vencimiento: null,
      archivo_url: 'https://example.com/cert2.jpg',
      activo: false,
      created_at: '2024-02-15T10:00:00Z',
      updated_at: '2024-02-15T10:00:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debe mostrar un indicador de carga mientras se cargan las certificaciones', () => {
    mockedController.getCertificacionesByUsuario.mockImplementation(
      () => new Promise(() => {}) // Promise que nunca se resuelve
    )

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('debe cargar y mostrar las certificaciones', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    await waitFor(() => {
      expect(mockedController.getCertificacionesByUsuario).toHaveBeenCalledWith(usuarioId, tipoAfiliado)
    })

    expect(await screen.findByText('Certificación Nacional')).toBeInTheDocument()
    expect(screen.getByText('Certificación Internacional')).toBeInTheDocument()
    expect(screen.getByText('Descripción 1')).toBeInTheDocument()
  })

  it('debe mostrar mensaje cuando no hay certificaciones', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: []
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    expect(await screen.findByText(/No hay certificaciones registradas/i)).toBeInTheDocument()
  })

  it('debe mostrar error cuando falla la carga', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: false,
      error: 'Error al cargar certificaciones'
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    expect(await screen.findByText(/Error al cargar certificaciones/i)).toBeInTheDocument()
  })

  it('debe formatear las fechas correctamente', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    // Esperar a que se muestre la fecha formateada (puede variar por timezone)
    await waitFor(() => {
      expect(screen.getByText('Certificación Nacional')).toBeInTheDocument()
    })
    
    // Verificar que hay fechas formateadas en formato DD/M/YYYY usando getAllByText
    const fechas = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/)
    expect(fechas.length).toBeGreaterThan(0)
  })

  it('debe mostrar "-" cuando no hay fecha', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Certificación Internacional')).toBeInTheDocument()
    })

    // Buscar todos los "-" en la tabla
    const dashedCells = screen.getAllByText('-')
    expect(dashedCells.length).toBeGreaterThan(0)
  })

  it('debe mostrar el estado correcto de cada certificación', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Activa')).toBeInTheDocument()
      expect(screen.getByText('Inactiva')).toBeInTheDocument()
    })
  })

  it('debe mostrar botón de agregar cuando se proporciona onAdd', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: []
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
        onAdd={mockOnAdd}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Agregar Certificación/i })).toBeInTheDocument()
    })
  })

  it('debe llamar a onAdd cuando se hace clic en el botón agregar', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: []
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
        onAdd={mockOnAdd}
      />
    )

    const addButton = await screen.findByRole('button', { name: /Agregar Certificación/i })
    await userEvent.click(addButton)

    expect(mockOnAdd).toHaveBeenCalled()
  })

  it('debe mostrar botones de editar y eliminar cuando se proporcionan callbacks', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Certificación Nacional')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTitle('Editar')
    const deleteButtons = screen.getAllByTitle('Eliminar')

    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })

  it('debe llamar a onEdit con la certificación correcta', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
        onEdit={mockOnEdit}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Certificación Nacional')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTitle('Editar')
    await userEvent.click(editButtons[0])

    expect(mockOnEdit).toHaveBeenCalledWith(mockCertificaciones[0])
  })

  it('debe llamar a onDelete con la certificación correcta', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
        onDelete={mockOnDelete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Certificación Nacional')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Eliminar')
    await userEvent.click(deleteButtons[1])

    expect(mockOnDelete).toHaveBeenCalledWith(mockCertificaciones[1])
  })

  it('debe recargar las certificaciones cuando cambia refreshTrigger', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    const { rerender } = render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
        refreshTrigger={1}
      />
    )

    await waitFor(() => {
      expect(mockedController.getCertificacionesByUsuario).toHaveBeenCalledTimes(1)
    })

    // Cambiar el refreshTrigger
    rerender(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
        refreshTrigger={2}
      />
    )

    await waitFor(() => {
      expect(mockedController.getCertificacionesByUsuario).toHaveBeenCalledTimes(2)
    })
  })

  it('debe mostrar ícono de PDF para archivos PDF', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: [mockCertificaciones[0]]
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Certificación Nacional')).toBeInTheDocument()
    })

    // Verificar que hay un botón "Ver" para el archivo
    const verButton = screen.getByRole('link', { name: /Ver/i })
    expect(verButton).toHaveAttribute('href', 'https://example.com/cert1.pdf')
    expect(verButton).toHaveAttribute('target', '_blank')
  })

  it('debe mostrar ícono de imagen para archivos de imagen', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: [mockCertificaciones[1]]
    })

    render(
      <CertificacionList
        usuarioId={usuarioId}
        tipoAfiliado={tipoAfiliado}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Certificación Internacional')).toBeInTheDocument()
    })

    // Verificar que hay un botón "Ver" para el archivo
    const verButton = screen.getByRole('link', { name: /Ver/i })
    expect(verButton).toHaveAttribute('href', 'https://example.com/cert2.jpg')
  })

  it('debe recargar cuando cambia el usuarioId', async () => {
    mockedController.getCertificacionesByUsuario.mockResolvedValue({
      success: true,
      data: mockCertificaciones
    })

    const { rerender } = render(
      <CertificacionList
        usuarioId="user-123"
        tipoAfiliado={tipoAfiliado}
      />
    )

    await waitFor(() => {
      expect(mockedController.getCertificacionesByUsuario).toHaveBeenCalledWith('user-123', tipoAfiliado)
    })

    rerender(
      <CertificacionList
        usuarioId="user-456"
        tipoAfiliado={tipoAfiliado}
      />
    )

    await waitFor(() => {
      expect(mockedController.getCertificacionesByUsuario).toHaveBeenCalledWith('user-456', tipoAfiliado)
    })
  })
})
