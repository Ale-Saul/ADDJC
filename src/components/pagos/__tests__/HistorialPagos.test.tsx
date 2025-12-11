import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import HistorialPagos from '../HistorialPagos'
import { pagoController } from '@/controllers/pagoController'
import { Pago } from '@/models/pago'

// Mock pagoController
jest.mock('@/controllers/pagoController')

describe('HistorialPagos', () => {
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
    estado: 'pagado',
    fecha_vencimiento: '2024-01-31',
    fecha_pago: '2024-01-15',
    metodo_pago: 'efectivo',
    observaciones_pago: null,
    pagado_por: 'user-123',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Carga y renderizado', () => {
    it('debe mostrar loading mientras carga', () => {
      ;(pagoController.getPagosByJudoka as jest.Mock).mockReturnValue(
        new Promise(() => {}) // Promise que nunca resuelve
      )

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('debe mostrar mensaje cuando no hay pagos completados', async () => {
      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText(/No hay pagos completados para Juan Pérez/)).toBeInTheDocument()
      })
    })

    it('debe cargar y mostrar pagos completados', async () => {
      const pagos = [
        createMockPago({ id: '1', concepto: 'Cuota Enero', estado: 'pagado' }),
        createMockPago({ id: '2', concepto: 'Cuota Febrero', estado: 'pagado' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText('Cuota Enero')).toBeInTheDocument()
        expect(screen.getByText('Cuota Febrero')).toBeInTheDocument()
      })
    })
  })

  describe('Filtrado por estado', () => {
    it('debe mostrar solo pagos con estado pagado, parcial o cancelado', async () => {
      const pagos = [
        createMockPago({ id: '1', concepto: 'Pago Completado', estado: 'pagado' }),
        createMockPago({ id: '2', concepto: 'Pago Parcial', estado: 'parcial' }),
        createMockPago({ id: '3', concepto: 'Pago Cancelado', estado: 'cancelado' }),
        createMockPago({ id: '4', concepto: 'Pago Pendiente', estado: 'pendiente' }),
        createMockPago({ id: '5', concepto: 'Pago Vencido', estado: 'vencido' })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText('Pago Completado')).toBeInTheDocument()
        expect(screen.getByText('Pago Parcial')).toBeInTheDocument()
        expect(screen.getByText('Pago Cancelado')).toBeInTheDocument()
      })

      // No debe mostrar pendientes ni vencidos
      expect(screen.queryByText('Pago Pendiente')).not.toBeInTheDocument()
      expect(screen.queryByText('Pago Vencido')).not.toBeInTheDocument()
    })
  })

  describe('Visualización de datos', () => {
    it('debe mostrar todas las columnas principales', async () => {
      const pagos = [createMockPago()]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText('Concepto')).toBeInTheDocument()
        expect(screen.getByText('Tipo')).toBeInTheDocument()
        expect(screen.getByText('Monto')).toBeInTheDocument()
        expect(screen.getByText('Fecha Pago')).toBeInTheDocument()
        expect(screen.getByText('Método')).toBeInTheDocument()
        expect(screen.getByText('Estado')).toBeInTheDocument()
      })
    })

    it('debe formatear el monto correctamente', async () => {
      const pagos = [createMockPago({ monto_final: 150.50 })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText(/Bs\.\s*150\.50/)).toBeInTheDocument()
      })
    })

    it('debe mostrar monto base si tiene descuento', async () => {
      const pagos = [
        createMockPago({
          monto_base: 200,
          monto_final: 180,
          tiene_descuento: true,
          tipo_descuento: 'porcentaje',
          descuento_porcentaje: 10
        })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText(/Base:.*Bs\.\s*200\.00/)).toBeInTheDocument()
      })
    })

    it('debe formatear fecha de pago en español boliviano', async () => {
      const pagos = [createMockPago({ fecha_pago: '2024-01-15' })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        // Formato: "14 ene 2024" o "15 ene 2024" (puede variar por zona horaria)
        expect(screen.getByText(/1[45].*en.*2024/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar método de pago como chip', async () => {
      const pagos = [createMockPago({ metodo_pago: 'tarjeta' })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        const chips = screen.getAllByText('tarjeta')
        expect(chips.length).toBeGreaterThan(0)
      })
    })

    it('debe mostrar descripción si existe', async () => {
      const pagos = [
        createMockPago({
          concepto: 'Cuota Enero',
          descripcion: 'Pago mensualidad de entrenamiento'
        })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText('Pago mensualidad de entrenamiento')).toBeInTheDocument()
      })
    })

    it('debe mostrar observaciones de pago si existen', async () => {
      const pagos = [
        createMockPago({
          observaciones_pago: 'Pagó con billete de 200, se dio vuelto 50'
        })
      ]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText(/Pagó con billete de 200/)).toBeInTheDocument()
      })
    })

    it('debe formatear tipo de pago reemplazando guiones bajos', async () => {
      const pagos = [createMockPago({ tipo_pago: 'cuota_mensual' })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText('cuota mensual')).toBeInTheDocument()
      })
    })
  })

  describe('Chips de estado', () => {
    it('debe mostrar chip verde para estado pagado', async () => {
      const pagos = [createMockPago({ estado: 'pagado' })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        const chip = screen.getByText('Pagado')
        expect(chip).toBeInTheDocument()
        expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
      })
    })

    it('debe mostrar chip azul para estado parcial', async () => {
      const pagos = [createMockPago({ estado: 'parcial' })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        const chip = screen.getByText('Parcial')
        expect(chip).toBeInTheDocument()
        expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorInfo')
      })
    })

    it('debe mostrar chip gris para estado cancelado', async () => {
      const pagos = [createMockPago({ estado: 'cancelado' })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        const chip = screen.getByText('Cancelado')
        expect(chip).toBeInTheDocument()
        expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault')
      })
    })
  })

  describe('Casos especiales', () => {
    it('debe mostrar guión cuando no hay fecha de pago', async () => {
      const pagos = [createMockPago({ fecha_pago: null })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        const dataRow = rows[1] // Primera fila de datos
        expect(dataRow).toHaveTextContent('-')
      })
    })

    it('debe mostrar guión cuando no hay método de pago', async () => {
      const pagos = [createMockPago({ metodo_pago: null })]

      ;(pagoController.getPagosByJudoka as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        const dataRow = rows[1]
        expect(dataRow).toHaveTextContent('-')
      })
    })

    it('debe manejar error en la carga de pagos', async () => {
      ;(pagoController.getPagosByJudoka as jest.Mock).mockRejectedValue(
        new Error('Error de red')
      )

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<HistorialPagos judokaId="judoka-1" judokaNombre="Juan Pérez" />)

      await waitFor(() => {
        expect(screen.getByText(/No hay pagos completados/)).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al cargar historial de pagos:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})
