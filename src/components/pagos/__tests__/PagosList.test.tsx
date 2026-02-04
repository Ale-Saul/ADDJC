import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PagosList from '../PagosList'
import { pagoController } from '@/controllers/pagoController'
import { Pago } from '@/models/pago'

// Mock del controlador de pagos
jest.mock('@/controllers/pagoController', () => ({
  pagoController: {
    getPagosByJudoka: jest.fn(),
    deletePago: jest.fn()
  }
}))

// Mock de RegistrarPagoForm y EditarPagoForm
jest.mock('../RegistrarPagoForm', () => {
  return function MockRegistrarPagoForm({ onSuccess, onCancel }: any) {
    return (
      <div data-testid="registrar-pago-form">
        <button onClick={onSuccess}>Confirmar Registro</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    )
  }
})

jest.mock('../EditarPagoForm', () => {
  return function MockEditarPagoForm({ pago, onSuccess, onCancel }: any) {
    return (
      <div data-testid="editar-pago-form">
        <span>Editando: {pago.concepto}</span>
        <button onClick={onSuccess}>Guardar Edición</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    )
  }
})

// Mock de window.confirm
const mockConfirm = jest.fn()
global.confirm = mockConfirm

// Mock de window.alert
const mockAlert = jest.fn()
global.alert = mockAlert

describe('PagosList', () => {
  const mockJudokaId = 'judoka-123'
  const mockJudokaNombre = 'Juan Pérez'

  const createMockPago = (overrides: Partial<Pago> = {}): Pago => ({
    id: 'pago-1',
    judoka_id: mockJudokaId,
    club_id: 'club-1',
    tipo_pago: 'cuota_mensual',
    concepto: 'Cuota Diciembre',
    descripcion: 'Descripción del pago',
    monto_base: 150,
    descuento: 0,
    tiene_descuento: false,
    monto_final: 150,
    fecha_vencimiento: '2024-12-31',
    estado: 'pendiente',
    activo: true,
    created_at: '2024-12-01T00:00:00.000Z',
    updated_at: '2024-12-01T00:00:00.000Z',
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  describe('Renderizado y carga de datos', () => {
    it('debe mostrar loading mientras carga los datos', () => {
      ;(pagoController.getPagosByJudoka as jest.Mock).mockReturnValue(
        new Promise(() => {}) // Promise que nunca se resuelve para mantener loading
      )

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('debe cargar y mostrar pagos pendientes y vencidos', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Cuota Diciembre', estado: 'pendiente' }),
        createMockPago({ id: '2', concepto: 'Cuota Traje', estado: 'vencido' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Cuota Diciembre')).toBeInTheDocument()
        expect(screen.getByText('Cuota Traje')).toBeInTheDocument()
      })
    })

    it('debe filtrar y mostrar solo pagos pendientes y vencidos', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pendiente', estado: 'pendiente' }),
        createMockPago({ id: '2', concepto: 'Vencido', estado: 'vencido' }),
        createMockPago({ id: '3', concepto: 'Pagado', estado: 'pagado' }),
        createMockPago({ id: '4', concepto: 'Cancelado', estado: 'cancelado' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        // Buscar chips de estado específicamente
        const pendienteElements = screen.getAllByText('Pendiente')
        const pendienteChip = pendienteElements.find(el => el.classList.contains('MuiChip-label'))
        expect(pendienteChip).toBeInTheDocument()
        
        const vencidoElements = screen.getAllByText('Vencido')
        const vencidoChip = vencidoElements.find(el => el.classList.contains('MuiChip-label'))
        expect(vencidoChip).toBeInTheDocument()
        
        expect(screen.queryByText('Pagado')).not.toBeInTheDocument()
        expect(screen.queryByText('Cancelado')).not.toBeInTheDocument()
      })
    })

    it('debe mostrar mensaje cuando no hay pagos pendientes', async () => {
      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText(/No hay pagos pendientes para Juan Pérez/)).toBeInTheDocument()
      })
    })

    it('debe mostrar descripción del pago cuando existe', async () => {
      const mockPagos = [
        createMockPago({ 
          concepto: 'Cuota Mensual',
          descripcion: 'Mes de Diciembre 2024'
        })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Mes de Diciembre 2024')).toBeInTheDocument()
      })
    })
  })

  describe('Formato y visualización', () => {
    it('debe formatear correctamente el tipo de pago', async () => {
      const mockPagos = [
        createMockPago({ tipo_pago: 'cuota_mensual' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('cuota mensual')).toBeInTheDocument()
      })
    })

    it('debe mostrar el monto final formateado', async () => {
      const mockPagos = [
        createMockPago({ monto_final: 150.50 })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Bs. 150.50')).toBeInTheDocument()
      })
    })

    it('debe mostrar monto base cuando hay descuento', async () => {
      const mockPagos = [
        createMockPago({ 
          monto_base: 200,
          descuento: 50,
          monto_final: 150,
          tiene_descuento: true
        })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Bs. 150.00')).toBeInTheDocument()
        expect(screen.getByText('(Base: Bs. 200.00)')).toBeInTheDocument()
      })
    })

    it('debe formatear correctamente la fecha de vencimiento', async () => {
      const mockPagos = [
        createMockPago({ fecha_vencimiento: '2024-12-31', concepto: 'Pago Año Nuevo', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        // Buscar la fecha form ateada (puede ser 30 o 31 dependiendo del timezone)
        const fechaElement = screen.getByText(/\d{1,2} dic 2024/)
        expect(fechaElement).toBeInTheDocument()
      })
    })

    it('debe mostrar chip de estado con color correcto - pendiente', async () => {
      const mockPagos = [
        createMockPago({ estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        const chip = screen.getByText('Pendiente')
        expect(chip).toBeInTheDocument()
      })
    })

    it('debe mostrar chip de estado con color correcto - vencido', async () => {
      const mockPagos = [
        createMockPago({ estado: 'vencido' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        const chip = screen.getByText('Vencido')
        expect(chip).toBeInTheDocument()
      })
    })
  })

  describe('Selección de pagos - checkbox individual', () => {
    it('debe permitir seleccionar un pago individual', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' }),
        createMockPago({ id: '2', concepto: 'Pago 2' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox1 = checkboxes[1] // El primero es "select all"

      fireEvent.click(checkbox1)

      expect(checkbox1).toBeChecked()
    })

    it('debe permitir deseleccionar un pago previamente seleccionado', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox = checkboxes[1]

      // Seleccionar
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()

      // Deseleccionar
      fireEvent.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('debe actualizar el contador de pagos seleccionados', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' }),
        createMockPago({ id: '2', concepto: 'Pago 2' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Inicialmente contador en 0
      expect(screen.getByText(/Registrar Pagos Seleccionados \(0\)/)).toBeInTheDocument()

      const checkboxes = screen.getAllByRole('checkbox')
      
      // Seleccionar primer pago
      fireEvent.click(checkboxes[1])
      expect(screen.getByText(/Registrar Pagos Seleccionados \(1\)/)).toBeInTheDocument()

      // Seleccionar segundo pago
      fireEvent.click(checkboxes[2])
      expect(screen.getByText(/Registrar Pagos Seleccionados \(2\)/)).toBeInTheDocument()
    })
  })

  describe('Selección de pagos - seleccionar todos', () => {
    it('debe seleccionar todos los pagos al hacer click en checkbox de encabezado', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' }),
        createMockPago({ id: '2', concepto: 'Pago 2' }),
        createMockPago({ id: '3', concepto: 'Pago 3' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const selectAllCheckbox = checkboxes[0]

      fireEvent.click(selectAllCheckbox)

      expect(screen.getByText(/Registrar Pagos Seleccionados \(3\)/)).toBeInTheDocument()
      
      // Verificar que todos los checkboxes individuales estén marcados
      checkboxes.slice(1).forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })

    it('debe deseleccionar todos los pagos si ya están todos seleccionados', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' }),
        createMockPago({ id: '2', concepto: 'Pago 2' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const selectAllCheckbox = checkboxes[0]

      // Seleccionar todos
      fireEvent.click(selectAllCheckbox)
      expect(screen.getByText(/Registrar Pagos Seleccionados \(2\)/)).toBeInTheDocument()

      // Deseleccionar todos
      fireEvent.click(selectAllCheckbox)
      expect(screen.getByText(/Registrar Pagos Seleccionados \(0\)/)).toBeInTheDocument()
    })

    it('debe mostrar checkbox de "seleccionar todos" en estado indeterminado', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' }),
        createMockPago({ id: '2', concepto: 'Pago 2' }),
        createMockPago({ id: '3', concepto: 'Pago 3' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      const selectAllCheckbox = checkboxes[0]

      // Seleccionar solo un pago
      fireEvent.click(checkboxes[1])

      // El checkbox de "seleccionar todos" debe estar en estado indeterminado
      // Usar getAttribute porque indeterminate es un atributo HTML
      await waitFor(() => {
        expect(selectAllCheckbox.getAttribute('data-indeterminate')).toBe('true')
      })
    })
  })

  describe('Botón registrar pagos', () => {
    it('debe estar deshabilitado cuando no hay pagos seleccionados', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      const registrarButton = screen.getByRole('button', { name: /Registrar Pagos Seleccionados/ })
      expect(registrarButton).toBeDisabled()
    })

    it('debe estar habilitado cuando hay pagos seleccionados', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Seleccionar un pago
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1])

      const registrarButton = screen.getByRole('button', { name: /Registrar Pagos Seleccionados/ })
      expect(registrarButton).not.toBeDisabled()
    })

    it('debe abrir el diálogo de registro al hacer click', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Seleccionar un pago
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1])

      const registrarButton = screen.getByRole('button', { name: /Registrar Pagos Seleccionados/ })
      fireEvent.click(registrarButton)

      await waitFor(() => {
        expect(screen.getByText('Registrar Pagos (1 pago)')).toBeInTheDocument()
        expect(screen.getByTestId('registrar-pago-form')).toBeInTheDocument()
      })
    })

    it('debe mostrar plural correcto en el diálogo cuando hay múltiples pagos', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' }),
        createMockPago({ id: '2', concepto: 'Pago 2' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Seleccionar todos
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])

      const registrarButton = screen.getByRole('button', { name: /Registrar Pagos Seleccionados/ })
      fireEvent.click(registrarButton)

      await waitFor(() => {
        expect(screen.getByText('Registrar Pagos (2 pagos)')).toBeInTheDocument()
      })
    })
  })

  describe('Registro de pagos', () => {
    it('debe limpiar selección y recargar datos después de registrar exitosamente', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1', estado: 'pendiente' })
      ]

      const mockPagosActualizados = [
        createMockPago({ id: '1', concepto: 'Pago 1', estado: 'pagado' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockPagos })
        .mockResolvedValueOnce({ success: true, data: [] }) // Después de registrar, ya no hay pendientes

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Seleccionar y abrir diálogo
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1])

      const registrarButton = screen.getByRole('button', { name: /Registrar Pagos Seleccionados/ })
      fireEvent.click(registrarButton)

      await waitFor(() => {
        expect(screen.getByTestId('registrar-pago-form')).toBeInTheDocument()
      })

      // Confirmar registro
      const confirmarButton = screen.getByRole('button', { name: 'Confirmar Registro' })
      fireEvent.click(confirmarButton)

      await waitFor(() => {
        expect(screen.queryByTestId('registrar-pago-form')).not.toBeInTheDocument()
      })

      // Verificar que se recargaron los pagos
      expect(pagoController.getPagosByJudoka).toHaveBeenCalledTimes(2)
    })

    it('debe cerrar el diálogo al cancelar registro', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Seleccionar y abrir diálogo
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1])

      const registrarButton = screen.getByRole('button', { name: /Registrar Pagos Seleccionados/ })
      fireEvent.click(registrarButton)

      await waitFor(() => {
        expect(screen.getByTestId('registrar-pago-form')).toBeInTheDocument()
      })

      // Cancelar
      const cancelarButton = screen.getAllByRole('button', { name: 'Cancelar' })[0]
      fireEvent.click(cancelarButton)

      await waitFor(() => {
        expect(screen.queryByTestId('registrar-pago-form')).not.toBeInTheDocument()
      })
    })

    it('debe llamar al callback onPagoDeleted después de registro exitoso', async () => {
      const mockOnPagoDeleted = jest.fn()
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockPagos })
        .mockResolvedValueOnce({ success: true, data: [] })

      render(
        <PagosList 
          judokaId={mockJudokaId} 
          judokaNombre={mockJudokaNombre}
          onPagoDeleted={mockOnPagoDeleted}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Seleccionar y registrar
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1])

      const registrarButton = screen.getByRole('button', { name: /Registrar Pagos Seleccionados/ })
      fireEvent.click(registrarButton)

      await waitFor(() => {
        expect(screen.getByTestId('registrar-pago-form')).toBeInTheDocument()
      })

      const confirmarButton = screen.getByRole('button', { name: 'Confirmar Registro' })
      fireEvent.click(confirmarButton)

      await waitFor(() => {
        expect(mockOnPagoDeleted).toHaveBeenCalled()
      })
    })
  })

  describe('Edición de pagos', () => {
    it('debe mostrar botón editar solo para pagos pendientes o vencidos', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Cuota Pendiente', estado: 'pendiente' }),
        createMockPago({ id: '2', concepto: 'Cuota Vencida', estado: 'vencido' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Cuota Pendiente')).toBeInTheDocument()
        expect(screen.getByText('Cuota Vencida')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByLabelText(/Editar Pago/i)
      expect(editButtons).toHaveLength(2)
    })

    it('debe abrir el diálogo de edición al hacer click en editar', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago para editar', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago para editar')).toBeInTheDocument()
      })

      const editButton = screen.getByLabelText(/Editar Pago/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Editar Pago')).toBeInTheDocument()
        expect(screen.getByTestId('editar-pago-form')).toBeInTheDocument()
        expect(screen.getByText('Editando: Pago para editar')).toBeInTheDocument()
      })
    })

    it('debe recargar datos y cerrar diálogo después de editar exitosamente', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago Original', monto_final: 100, estado: 'pendiente' })
      ]

      const mockPagosActualizados = [
        createMockPago({ id: '1', concepto: 'Pago Editado', monto_final: 150, estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockPagos })
        .mockResolvedValueOnce({ success: true, data: mockPagosActualizados })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago Original')).toBeInTheDocument()
      })

      // Abrir diálogo de edición
      const editButton = screen.getByLabelText(/Editar Pago/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('editar-pago-form')).toBeInTheDocument()
      })

      // Guardar edición
      const guardarButton = screen.getByRole('button', { name: 'Guardar Edición' })
      fireEvent.click(guardarButton)

      await waitFor(() => {
        expect(screen.queryByTestId('editar-pago-form')).not.toBeInTheDocument()
      })

      // Verificar que se recargaron los datos
      expect(pagoController.getPagosByJudoka).toHaveBeenCalledTimes(2)
    })

    it('debe cerrar el diálogo al cancelar edición', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago')).toBeInTheDocument()
      })

      // Abrir diálogo de edición
      const editButton = screen.getByLabelText(/Editar Pago/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('editar-pago-form')).toBeInTheDocument()
      })

      // Cancelar
      const cancelarButtons = screen.getAllByRole('button', { name: 'Cancelar' })
      fireEvent.click(cancelarButtons[0])

      await waitFor(() => {
        expect(screen.queryByTestId('editar-pago-form')).not.toBeInTheDocument()
      })
    })
  })

  describe('Eliminación de pagos', () => {
    it('debe mostrar confirmación antes de eliminar', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago a eliminar' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago a eliminar')).toBeInTheDocument()
      })

      // Buscar el botón por el icono DeleteIcon
      const deleteIcons = screen.getAllByTestId('DeleteIcon')
      const deleteButton = deleteIcons[0].closest('button')!
      await userEvent.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledWith('¿Estás seguro de eliminar el pago "Pago a eliminar"?')
    })

    it('debe eliminar el pago si se confirma', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago a eliminar', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockPagos })
        .mockResolvedValueOnce({ success: true, data: [] })

      ;(pagoController.deletePago as jest.Mock).mockResolvedValue({ success: true })

      mockConfirm.mockReturnValue(true)

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago a eliminar')).toBeInTheDocument()
      })

      // Buscar el botón delete por el icono DeleteIcon
      const deleteButtons = screen.getAllByTestId('DeleteIcon')
      const deleteButton = deleteButtons[0].closest('button')!
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(pagoController.deletePago).toHaveBeenCalledWith('1')
      })

      // Verificar que se recargaron los datos
      await waitFor(() => {
        expect(pagoController.getPagosByJudoka).toHaveBeenCalledTimes(2)
      })
    })

    it('no debe eliminar si se cancela la confirmación', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      mockConfirm.mockReturnValue(false)

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago')).toBeInTheDocument()
      })

      // Buscar el botón delete por el icono DeleteIcon
      const deleteButtons = screen.getAllByTestId('DeleteIcon')
      const deleteButton = deleteButtons[0].closest('button')!
      await userEvent.click(deleteButton)

      expect(pagoController.deletePago).not.toHaveBeenCalled()
    })

    it('debe deshabilitar el botón mientras elimina', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      let resolveDelete: any
      ;(pagoController.deletePago as jest.Mock).mockReturnValue(
        new Promise(resolve => { resolveDelete = resolve })
      )

      mockConfirm.mockReturnValue(true)

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago')).toBeInTheDocument()
      })

      // Buscar el botón delete por el icono DeleteIcon
      const deleteButtons = screen.getAllByTestId('DeleteIcon')
      const deleteButton = deleteButtons[0].closest('button')!
      await userEvent.click(deleteButton)

      // Verificar que deletePago fue llamado
      await waitFor(() => {
        expect(pagoController.deletePago).toHaveBeenCalledWith('1')
      })
      
      // Resolver la promesa
      resolveDelete({ success: true })
    })

    it('debe mostrar alerta si falla la eliminación', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      ;(pagoController.deletePago as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error en la base de datos'
      })

      mockConfirm.mockReturnValue(true)

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago')).toBeInTheDocument()
      })

      // Buscar el botón delete por el icono DeleteIcon
      const deleteButtons = screen.getAllByTestId('DeleteIcon')
      const deleteButton = deleteButtons[0].closest('button')!
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(pagoController.deletePago).toHaveBeenCalledWith('1')
      })

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error al eliminar: Error en la base de datos')
      }, { timeout: 3000 })
    })

    it('debe llamar al callback onPagoDeleted después de eliminar exitosamente', async () => {
      const mockOnPagoDeleted = jest.fn()
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago', estado: 'pendiente' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockPagos })
        .mockResolvedValueOnce({ success: true, data: [] })

      ;(pagoController.deletePago as jest.Mock).mockResolvedValue({ success: true })

      mockConfirm.mockReturnValue(true)

      render(
        <PagosList 
          judokaId={mockJudokaId} 
          judokaNombre={mockJudokaNombre}
          onPagoDeleted={mockOnPagoDeleted}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Pago')).toBeInTheDocument()
      })

      // Buscar el botón delete por el icono DeleteIcon
      const deleteButtons = screen.getAllByTestId('DeleteIcon')
      const deleteButton = deleteButtons[0].closest('button')!
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(pagoController.deletePago).toHaveBeenCalledWith('1')
      })

      await waitFor(() => {
        expect(mockOnPagoDeleted).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Resaltado de filas seleccionadas', () => {
    it('debe resaltar las filas de pagos seleccionados', async () => {
      const mockPagos = [
        createMockPago({ id: '1', concepto: 'Pago 1', estado: 'pendiente' }),
        createMockPago({ id: '2', concepto: 'Pago 2', estado: 'vencido' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPagos
      })

      render(<PagosList judokaId={mockJudokaId} judokaNombre={mockJudokaNombre} />)

      await waitFor(() => {
        expect(screen.getByText('Pago 1')).toBeInTheDocument()
      })

      // Seleccionar primer pago
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1])

      // Verificar que la fila tiene el atributo aria-selected
      const row = screen.getByText('Pago 1').closest('tr')
      expect(row).toHaveClass('Mui-selected')
    })
  })
})
