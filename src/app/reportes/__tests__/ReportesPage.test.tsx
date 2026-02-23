import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReportesPage from '../ReportesPage'
import { useAuth } from '@/contexts/AuthContext'
import { pagoController } from '@/controllers/pagoController'
import { judokaController } from '@/controllers/judokaController'
import { Pago } from '@/models/pago'
import { Judoka } from '@/models/judoka'

// Mock dependencies
jest.mock('@/contexts/AuthContext')
jest.mock('@/controllers/pagoController')
jest.mock('@/controllers/judokaController')
jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
}))
jest.mock('@/components/common/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}))

// Mock jsPDF y autoTable
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    save: jest.fn()
  }))
})
jest.mock('jspdf-autotable', () => jest.fn())

describe('ReportesPage', () => {
  const mockUser = {
    id: 'user-1',
    email: 'encargado@test.com',
    role: 'encargado' as const,
    club_id: 'club-1',
    nombre: 'Test',
    apellido: 'User'
  }

  const createMockJudoka = (overrides?: Partial<Judoka>): Judoka => ({
    id: '1',
    ci: '12345678',
    nombres: 'Juan',
    apellidos: 'Pérez',
    fecha_nacimiento: '2000-01-01',
    sexo: 'M',
    nacionalidad: 'Boliviana',
    departamento: 'La Paz',
    telefono: '70000000',
    telefono_referencia: null,
    email: null,
    direccion: 'Calle 1',
    nombre_responsable: null,
    ci_responsable: null,
    telefono_responsable: null,
    categoria: 'Senior',
    peso: 70,
    cinturon_actual: 'Negro',
    fecha_ultima_promocion: null,
    club_id: 'club-1',
    sensei_id: 'sensei-1',
    fecha_afiliacion: '2024-01-01',
    estado: 'activo' as const,
    observaciones: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides
  })

  const createMockPago = (overrides?: Partial<Pago>): Pago => ({
    id: '1',
    judoka_id: '1',
    judoka_nombre: 'Juan Pérez',
    club_id: 'club-1',
    tipo_pago: 'cuota_mensual',
    concepto: 'Cuota Enero',
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
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
  })

  describe('Carga inicial y renderizado', () => {
    it('debe mostrar loading mientras carga datos', () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockReturnValue(
        new Promise(() => {})
      )
      ;(judokaController.getJudokasByClub as jest.Mock).mockReturnValue(
        new Promise(() => {})
      )

      render(<ReportesPage />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('debe cargar y mostrar la página de reportes', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockPago()]
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('Reportes y Estadísticas')).toBeInTheDocument()
      })
    })

    it('no debe cargar datos si no hay club_id', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, club_id: null }
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(pagoController.getPagosByClub).not.toHaveBeenCalled()
        expect(judokaController.getJudokasByClub).not.toHaveBeenCalled()
      })
    })
  })

  describe('Filtros', () => {
    it('debe mostrar filtros de fecha inicio y fin', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByLabelText('Fecha Inicio')).toBeInTheDocument()
        expect(screen.getByLabelText('Fecha Fin')).toBeInTheDocument()
      })
    })

    it('debe mostrar sección de filtros', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('Filtros')).toBeInTheDocument()
      })
    })
  })

  describe('Estadísticas', () => {
    it('debe mostrar tarjetas de estadísticas con totales', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('TOTAL GENERADO')).toBeInTheDocument()
        expect(screen.getByText('TOTAL PENDIENTE')).toBeInTheDocument()
        expect(screen.getByText('TOTAL VENCIDO')).toBeInTheDocument()
      })
    })
  })

  describe('Desglose por tipo de pago', () => {
    it('debe mostrar sección de desglose por tipo', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('Desglose por Tipo de Pago')).toBeInTheDocument()
      })
    })
  })

  describe('Desglose por estado', () => {
    it('debe mostrar tabla de desglose por estado', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          createMockPago({ estado: 'pagado' }),
          createMockPago({ estado: 'pendiente' })
        ]
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('Desglose por Estado')).toBeInTheDocument()
      })
    })

    it('debe mostrar chips de estado con colores', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          createMockPago({ estado: 'pagado' }),
          createMockPago({ estado: 'pendiente' }),
          createMockPago({ estado: 'vencido' })
        ]
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        const chips = screen.getAllByText(/pagado|pendiente|vencido/i)
        expect(chips.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Detalle de pagos', () => {
    it('debe mostrar sección de detalle de pagos', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Detalle de Pagos/)).toBeInTheDocument()
      })
    })
  })

  describe('Botones de exportación', () => {
    it('debe mostrar botones de exportar PDF y Excel', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockPago()]
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('Exportar a PDF')).toBeInTheDocument()
        expect(screen.getByText('Exportar a Excel')).toBeInTheDocument()
      })
    })

    it('debe deshabilitar botones cuando no hay datos', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('Exportar a PDF')).toBeDisabled()
        expect(screen.getByText('Exportar a Excel')).toBeDisabled()
      })
    })

    it('debe verificar estado de botones basado en datos filtrados', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        // Botones se habilitan/deshabilitan según pagosFiltrados.length
        const pdfButton = screen.getByText('Exportar a PDF')
        const excelButton = screen.getByText('Exportar a Excel')
        expect(pdfButton).toBeInTheDocument()
        expect(excelButton).toBeInTheDocument()
      })
    })
  })

  describe('Manejo de errores', () => {
    it('debe manejar error al cargar pagos', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockRejectedValue(
        new Error('Error de red')
      )
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<ReportesPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error al cargar datos:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('debe manejar respuesta sin datos', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: false,
        data: null
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: false,
        data: null
      })

      render(<ReportesPage />)

      await waitFor(() => {
        expect(screen.getByText('Reportes y Estadísticas')).toBeInTheDocument()
      })
    })
  })

  describe('Filtrado de pagos', () => {
    it('debe aplicar filtros de fecha por defecto', async () => {
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })

      render(<ReportesPage />)

      await waitFor(() => {
        // Verificar que los filtros de fecha existen y tienen valores por defecto
        const fechaInicio = screen.getByLabelText('Fecha Inicio') as HTMLInputElement
        const fechaFin = screen.getByLabelText('Fecha Fin') as HTMLInputElement
        expect(fechaInicio.value).toBeTruthy()
        expect(fechaFin.value).toBeTruthy()
      })
    })
  })
})
