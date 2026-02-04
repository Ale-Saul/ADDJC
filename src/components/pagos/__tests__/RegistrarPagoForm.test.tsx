import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrarPagoForm from '../RegistrarPagoForm'
import { pagoController } from '@/controllers/pagoController'
import { Pago } from '@/models/pago'

// Mock del contexto de autenticación
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' }
  })
}))

// Mock del controlador de pagos
jest.mock('@/controllers/pagoController', () => ({
  pagoController: {
    updatePago: jest.fn()
  }
}))

describe('RegistrarPagoForm', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()

  // Helper para crear mock de pago
  const createMockPago = (overrides: Partial<Pago> = {}): Pago => ({
    id: '1',
    judoka_id: 'judoka-1',
    concepto: 'Cuota Mensual',
    descripcion: 'Mes de Enero',
    tipo_pago: 'cuota_mensual',
    monto_base: 150,
    monto_final: 150,
    tiene_descuento: false,
    descuento_monto: 0,
    descuento_porcentaje: 0,
    estado: 'pendiente',
    fecha_vencimiento: '2024-12-31',
    fecha_pago: null,
    metodo_pago: null,
    observaciones_pago: null,
    pagado_por: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-12-15T10:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Renderizado y validación', () => {
    it('debe mostrar el formulario con campos y fecha actual por defecto', () => {
      const pagos = [createMockPago()]
      const { container } = render(<RegistrarPagoForm pagos={pagos} />)

      expect(screen.getByText(/Registrando/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha de Pago/)).toHaveValue('2024-12-15')
      // MUI Select no tiene label asociado, usar querySelector
      expect(container.querySelector('input[name="metodo_pago"]')).toHaveValue('efectivo')
      expect(screen.getByLabelText(/Observaciones/)).toBeInTheDocument()
    })

    it('debe mostrar singular/plural según cantidad de pagos', () => {
      const { rerender } = render(<RegistrarPagoForm pagos={[createMockPago()]} />)
      // Texto dividido por <strong>, usar matcher de función
      expect(screen.getByRole('heading', { level: 6, name: (content, element) => {
        return element?.textContent === 'Registrando 1 pago'
      }})).toBeInTheDocument()

      rerender(<RegistrarPagoForm pagos={[createMockPago({ id: '1' }), createMockPago({ id: '2' })]} />)
      expect(screen.getByRole('heading', { level: 6, name: (content, element) => {
        return element?.textContent === 'Registrando 2 pagos'
      }})).toBeInTheDocument()
    })

    it('campos requeridos deben tener atributo required', () => {
      const { container } = render(<RegistrarPagoForm pagos={[createMockPago()]} />)

      expect(screen.getByLabelText(/Fecha de Pago/)).toHaveAttribute('required')
      // MUI Select usa input hidden con required
      const selectHiddenInput = container.querySelector('input[name="metodo_pago"]')
      expect(selectHiddenInput).toHaveAttribute('required')
      expect(screen.getByLabelText(/Observaciones/)).not.toHaveAttribute('required')
    })
  })

  describe('Cálculo de totales', () => {
    it('debe calcular y mostrar el total correctamente', () => {
      const pagos = [
        createMockPago({ id: 'pago1', monto_final: 100 }),
        createMockPago({ id: 'pago2', monto_final: 50 })
      ]
      render(<RegistrarPagoForm pagos={pagos} />)

      expect(screen.getByText(/Total a Pagar:.*Bs\..*150\.00/)).toBeInTheDocument()
    })

    it('debe mostrar desglose solo para múltiples pagos', () => {
      const { rerender } = render(
        <RegistrarPagoForm pagos={[createMockPago({ concepto: 'Cuota' })]} />
      )
      expect(screen.queryByText(/Cuota: Bs\./)).not.toBeInTheDocument()

      rerender(
        <RegistrarPagoForm pagos={[
          createMockPago({ id: '1', concepto: 'Enero', monto_final: 150 }),
          createMockPago({ id: '2', concepto: 'Febrero', monto_final: 150 })
        ]} />
      )
      expect(screen.getByText(/Enero: Bs\. 150\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\+/)).toBeInTheDocument()
    })
  })

  describe('Registro de pagos', () => {
    it('debe registrar un pago con los datos correctos', async () => {
      ;(pagoController.updatePago as jest.Mock).mockResolvedValue({ success: true })

      render(<RegistrarPagoForm pagos={[createMockPago({ id: '1' })]} onSuccess={mockOnSuccess} />)

      fireEvent.click(screen.getByRole('button', { name: /Registrar/ }))

      await waitFor(() => {
        expect(pagoController.updatePago).toHaveBeenCalledWith('1', expect.objectContaining({
          estado: 'pagado',
          metodo_pago: 'efectivo'
        }))
      })
    })

    it('debe registrar múltiples pagos en paralelo', async () => {
      ;(pagoController.updatePago as jest.Mock).mockResolvedValue({ success: true })

      const pagos = [createMockPago({ id: '1' }), createMockPago({ id: '2' }), createMockPago({ id: '3' })]
      render(<RegistrarPagoForm pagos={pagos} />)

      fireEvent.click(screen.getByRole('button', { name: /Registrar 3 Pagos/ }))

      await waitFor(() => {
        expect(pagoController.updatePago).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Manejo de errores', () => {
    it('debe mostrar error si fallan pagos', async () => {
      ;(pagoController.updatePago as jest.Mock).mockResolvedValue({ success: false })

      render(<RegistrarPagoForm pagos={[createMockPago()]} />)
      fireEvent.click(screen.getByRole('button', { name: /Registrar/ }))

      await waitFor(() => {
        expect(screen.getByText(/Error al registrar/)).toBeInTheDocument()
      })
    })
  })

  describe('Botón cancelar', () => {
    it('debe llamar onCancel al hacer click', () => {
      render(<RegistrarPagoForm pagos={[createMockPago()]} onCancel={mockOnCancel} />)
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }))
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })
})
