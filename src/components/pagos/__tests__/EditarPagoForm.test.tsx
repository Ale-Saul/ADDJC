import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditarPagoForm from '../EditarPagoForm'
import { pagoController } from '@/controllers/pagoController'
import { Pago } from '@/models/pago'

// Mock pagoController
jest.mock('@/controllers/pagoController')

describe('EditarPagoForm', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()

  const createMockPago = (overrides?: Partial<Pago>): Pago => ({
    id: '1',
    judoka_id: 'judoka-1',
    judoka_nombre: 'Juan Pérez',
    tipo_pago: 'cuota_mensual',
    concepto: 'Cuota Enero 2024',
    descripcion: null,
    monto_base: 150,
    tiene_descuento: false,
    tipo_descuento: null,
    descuento_porcentaje: null,
    descuento_monto: null,
    razon_descuento: null,
    monto_final: 150,
    estado: 'pendiente',
    fecha_vencimiento: '2024-01-31',
    fecha_pago: null,
    metodo_pago: null,
    observaciones_pago: null,
    pagador_id: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderizado y campos', () => {
    it('debe mostrar el formulario con datos pre-poblados', () => {
      const pago = createMockPago()
      const { container } = render(<EditarPagoForm pago={pago} />)

      // Texto dividido por <strong>
      expect(screen.getByRole('heading', { level: 6, name: (content, element) => {
        return element?.textContent === 'Editar pago: Cuota Enero 2024'
      }})).toBeInTheDocument()
      expect(screen.getByLabelText(/Concepto/)).toHaveValue('Cuota Enero 2024')
      expect(screen.getByLabelText(/Monto Base/)).toHaveValue(150)
      expect(screen.getByLabelText(/Fecha de Vencimiento/)).toHaveValue('2024-01-31')
      // Select usa input hidden
      expect(container.querySelector('input[name="tipo_pago"]')).toHaveValue('cuota_mensual')
    })

    it('debe mostrar switch de descuento no marcado por defecto', () => {
      const pago = createMockPago()
      render(<EditarPagoForm pago={pago} />)

      const switchElement = screen.getByRole('switch', { name: /Aplicar descuento/i })
      expect(switchElement).not.toBeChecked()
      expect(screen.queryByLabelText(/Tipo de Descuento/)).not.toBeInTheDocument()
    })

    it('debe mostrar campos de descuento si el pago tiene descuento', () => {
      const pago = createMockPago({
        tiene_descuento: true,
        tipo_descuento: 'porcentaje',
        descuento_porcentaje: 10
      })
      const { container } = render(<EditarPagoForm pago={pago} />)

      expect(screen.getByRole('switch', { name: /Aplicar descuento/i })).toBeChecked()
      // Select sin label asociado, usar querySelector
      expect(container.querySelector('input[name="tipo_descuento"]')).toHaveValue('porcentaje')
      expect(screen.getByLabelText(/Descuento \(%\)/)).toHaveValue(10)
    })
  })

  describe('Cálculo de monto final', () => {
    it('debe calcular monto final con descuento porcentual', () => {
      const pago = createMockPago({ monto_base: 200 })
      const { container } = render(<EditarPagoForm pago={pago} />)

      // Activar descuento
      fireEvent.click(screen.getByRole('switch', { name: /Aplicar descuento/i }))

      // Seleccionar tipo porcentaje
      const tipoSelect = container.querySelector('input[name="tipo_descuento"]')!
      fireEvent.change(tipoSelect, { target: { value: 'porcentaje' } })

      // Ingresar 10%
      const porcentajeInput = screen.getByLabelText(/Descuento \(%\)/)
      fireEvent.change(porcentajeInput, { target: { value: '10' } })

      // Verificar cálculo: 200 - 10% = 180
      expect(screen.getByText(/Monto Final:.*Bs\.\s*180\.00/)).toBeInTheDocument()
    })

    it('debe calcular monto final con descuento en monto', () => {
      const pago = createMockPago({ monto_base: 150 })
      const { container } = render(<EditarPagoForm pago={pago} />)

      // Activar descuento
      fireEvent.click(screen.getByRole('switch', { name: /Aplicar descuento/i }))

      // Seleccionar tipo monto
      const tipoSelect = container.querySelector('input[name="tipo_descuento"]')!
      fireEvent.change(tipoSelect, { target: { value: 'monto' } })

      // Ingresar 50 Bs
      const montoInput = screen.getByLabelText(/Descuento \(Monto\)/)
      fireEvent.change(montoInput, { target: { value: '50' } })

      // Verificar cálculo: 150 - 50 = 100
      expect(screen.getByText(/Monto Final:.*Bs\.\s*100\.00/)).toBeInTheDocument()
    })

    it('debe mostrar monto anterior si cambió', () => {
      const pago = createMockPago({ monto_base: 100, monto_final: 100 })
      render(<EditarPagoForm pago={pago} />)

      // Cambiar monto base
      fireEvent.change(screen.getByLabelText(/Monto Base/), { target: { value: '200' } })

      // Debe mostrar anterior
      expect(screen.getByText(/Anterior:.*Bs\.\s*100\.00/)).toBeInTheDocument()
    })
  })

  describe('Interacción con descuentos', () => {
    it('debe mostrar campos de porcentaje al seleccionar tipo porcentaje', () => {
      const pago = createMockPago()
      const { container } = render(<EditarPagoForm pago={pago} />)

      // Activar descuento
      fireEvent.click(screen.getByRole('switch', { name: /Aplicar descuento/i }))

      // Seleccionar porcentaje
      const tipoSelect = container.querySelector('input[name="tipo_descuento"]')!
      fireEvent.change(tipoSelect, { target: { value: 'porcentaje' } })

      expect(screen.getByLabelText(/Descuento \(%\)/)).toBeInTheDocument()
      expect(screen.queryByLabelText(/Descuento \(Monto\)/)).not.toBeInTheDocument()
    })

    it('debe mostrar campos de monto al seleccionar tipo monto', () => {
      const pago = createMockPago()
      const { container } = render(<EditarPagoForm pago={pago} />)

      // Activar descuento
      fireEvent.click(screen.getByRole('switch', { name: /Aplicar descuento/i }))

      // Seleccionar monto
      const tipoSelect = container.querySelector('input[name="tipo_descuento"]')!
      fireEvent.change(tipoSelect, { target: { value: 'monto' } })

      expect(screen.getByLabelText(/Descuento \(Monto\)/)).toBeInTheDocument()
      expect(screen.queryByLabelText(/Descuento \(%\)/)).not.toBeInTheDocument()
    })

    it('debe limpiar campos de descuento al desactivar switch', () => {
      const pago = createMockPago({
        tiene_descuento: true,
        tipo_descuento: 'porcentaje',
        descuento_porcentaje: 10
      })
      render(<EditarPagoForm pago={pago} />)

      // Desactivar descuento
      fireEvent.click(screen.getByRole('switch', { name: /Aplicar descuento/i }))

      // No debe mostrar campos de descuento
      expect(screen.queryByLabelText(/Tipo de Descuento/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Descuento/)).not.toBeInTheDocument()
    })
  })

  describe('Actualización de pago', () => {
    it('debe actualizar pago exitosamente', async () => {
      ;(pagoController.updatePago as jest.Mock).mockResolvedValue({ success: true })

      const pago = createMockPago()
      render(<EditarPagoForm pago={pago} onSuccess={mockOnSuccess} />)

      // Cambiar concepto
      fireEvent.change(screen.getByLabelText(/Concepto/), { target: { value: 'Cuota Febrero' } })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

      await waitFor(() => {
        expect(pagoController.updatePago).toHaveBeenCalledWith('1', expect.objectContaining({
          concepto: 'Cuota Febrero',
          monto_final: 150
        }))
      })

      await waitFor(() => {
        expect(screen.getByText(/actualizado exitosamente/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error si falla la actualización', async () => {
      ;(pagoController.updatePago as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error de prueba'
      })

      const pago = createMockPago()
      render(<EditarPagoForm pago={pago} />)

      fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

      await waitFor(() => {
        expect(screen.getByText(/Error de prueba/)).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Botones de acción', () => {
    it('debe llamar onCancel al hacer click en cancelar', () => {
      const pago = createMockPago()
      render(<EditarPagoForm pago={pago} onCancel={mockOnCancel} />)

      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('debe deshabilitar botones durante carga', async () => {
      ;(pagoController.updatePago as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const pago = createMockPago()
      render(<EditarPagoForm pago={pago} />)

      const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i })
      const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })

      fireEvent.click(submitBtn)

      // Botones deshabilitados
      await waitFor(() => {
        expect(submitBtn).toBeDisabled()
        expect(cancelBtn).toBeDisabled()
      })
    })
  })
})
