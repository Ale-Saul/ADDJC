import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PagosPage from '../PagosPage'
import { useAuth } from '@/contexts/AuthContext'
import { judokaController } from '@/controllers/judokaController'
import { pagoController } from '@/controllers/pagoController'
import { Judoka } from '@/models/judoka'
import { Pago } from '@/models/pago'

// Mock dependencies
jest.mock('@/contexts/AuthContext')
jest.mock('@/controllers/judokaController')
jest.mock('@/controllers/pagoController')
jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
}))
jest.mock('@/components/common/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}))
jest.mock('@/components/forms/PagoForm', () => ({
  __esModule: true,
  default: ({ onSuccess, onCancel }: any) => (
    <div data-testid="pago-form">
      <button onClick={onSuccess}>Guardar</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  )
}))
jest.mock('@/components/pagos/PagosList', () => ({
  __esModule: true,
  default: ({ judokaId, onPagoDeleted }: any) => (
    <div data-testid="pagos-list">
      Lista de pagos para {judokaId}
      <button onClick={onPagoDeleted}>Eliminar pago</button>
    </div>
  )
}))
jest.mock('@/components/pagos/HistorialPagos', () => ({
  __esModule: true,
  default: ({ judokaId }: any) => <div data-testid="historial-pagos">Historial para {judokaId}</div>
}))
jest.mock('@/components/pagos/PagoMasivoForm', () => ({
  __esModule: true,
  default: ({ onSuccess, onCancel }: any) => (
    <div data-testid="pago-masivo-form">
      <button onClick={onSuccess}>Crear Masivo</button>
      <button onClick={onCancel}>Cancelar Masivo</button>
    </div>
  )
}))
jest.mock('@/components/pagos/PagosStats', () => ({
  __esModule: true,
  default: ({ pagos }: any) => <div data-testid="pagos-stats">Stats con {pagos.length} pagos</div>
}))

describe('PagosPage', () => {
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
    judoka_id: 'judoka-1',
    judoka_nombre: 'Juan Pérez',
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
    pagado_por: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
  })

  describe('Carga inicial y renderizado', () => {
    it('debe mostrar loading mientras carga datos', () => {
      ;(judokaController.getJudokasByClub as jest.Mock).mockReturnValue(
        new Promise(() => {}) // Promise que nunca resuelve
      )
      ;(pagoController.getPagosByClub as jest.Mock).mockReturnValue(
        new Promise(() => {})
      )

      render(<PagosPage />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('debe cargar y mostrar judokas del club', async () => {
      const judokas = [
        createMockJudoka({ id: '1', nombres: 'Juan', apellidos: 'Pérez' }),
        createMockJudoka({ id: '2', nombres: 'María', apellidos: 'López' })
      ]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
        expect(screen.getByText('Pérez')).toBeInTheDocument()
        expect(screen.getByText('María')).toBeInTheDocument()
        expect(screen.getByText('López')).toBeInTheDocument()
      })
    })

    it('debe mostrar mensaje cuando no hay judokas', async () => {
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText(/No hay judokas registrados en tu club/)).toBeInTheDocument()
      })
    })

    it('debe filtrar judokas sin club_id (no inscritos)', async () => {
      const judokas = [
        createMockJudoka({ id: '1', nombres: 'Juan', club_id: 'club-1' }),
        createMockJudoka({ id: '2', nombres: 'María', club_id: null }),
        createMockJudoka({ id: '3', nombres: 'Pedro', club_id: 'club-1' })
      ]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
        expect(screen.getByText('Pedro')).toBeInTheDocument()
        expect(screen.queryByText('María')).not.toBeInTheDocument()
      })
    })

    it('debe mostrar componente PagosStats con pagos cargados', async () => {
      const pagos = [createMockPago(), createMockPago({ id: '2' })]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: [createMockJudoka()]
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: pagos
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByTestId('pagos-stats')).toBeInTheDocument()
        expect(screen.getByText(/Stats con 2 pagos/)).toBeInTheDocument()
      })
    })
  })

  describe('Búsqueda de judokas', () => {
    it('debe filtrar judokas por nombre', async () => {
      const judokas = [
        createMockJudoka({ id: '1', nombres: 'Juan', apellidos: 'Pérez' }),
        createMockJudoka({ id: '2', nombres: 'María', apellidos: 'López' }),
        createMockJudoka({ id: '3', nombres: 'Pedro', apellidos: 'García' })
      ]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Buscar judoka/)
      fireEvent.change(searchInput, { target: { value: 'juan' } })

      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.queryByText('María')).not.toBeInTheDocument()
      expect(screen.queryByText('Pedro')).not.toBeInTheDocument()
    })

    it('debe filtrar judokas por apellido', async () => {
      const judokas = [
        createMockJudoka({ id: '1', nombres: 'Juan', apellidos: 'Pérez' }),
        createMockJudoka({ id: '2', nombres: 'María', apellidos: 'López' })
      ]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Pérez')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Buscar judoka/)
      fireEvent.change(searchInput, { target: { value: 'lópez' } })

      expect(screen.getByText('María')).toBeInTheDocument()
      expect(screen.queryByText('Juan')).not.toBeInTheDocument()
    })

    it('debe mostrar mensaje cuando no se encuentran resultados', async () => {
      const judokas = [createMockJudoka({ nombres: 'Juan', apellidos: 'Pérez' })]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Buscar judoka/)
      fireEvent.change(searchInput, { target: { value: 'xyz123' } })

      expect(screen.getByText(/No se encontraron judokas con "xyz123"/)).toBeInTheDocument()
    })
  })

  describe('Botones de acción por judoka', () => {
    it('debe abrir diálogo de nuevo pago al hacer click en botón Nuevo Pago', async () => {
      const judokas = [createMockJudoka({ nombres: 'Juan', apellidos: 'Pérez' })]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      // Buscar el botón de Nuevo Pago (AddIcon)
      const addButtons = screen.getAllByTestId('AddIcon')
      fireEvent.click(addButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText('Crear Nuevo Pago')).toBeInTheDocument()
        expect(screen.getByTestId('pago-form')).toBeInTheDocument()
      })
    })

    it('debe abrir diálogo de pagos pendientes al hacer click en Ver Pagos', async () => {
      const judokas = [createMockJudoka({ nombres: 'Juan', apellidos: 'Pérez' })]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      const visibilityButtons = screen.getAllByTestId('VisibilityIcon')
      fireEvent.click(visibilityButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText(/Pagos Pendientes - Juan Pérez/)).toBeInTheDocument()
        expect(screen.getByTestId('pagos-list')).toBeInTheDocument()
      })
    })

    it('debe abrir diálogo de historial al hacer click en Ver Historial', async () => {
      const judokas = [createMockJudoka({ nombres: 'Juan', apellidos: 'Pérez' })]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      const historyButtons = screen.getAllByTestId('HistoryIcon')
      fireEvent.click(historyButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText(/Historial de Pagos - Juan Pérez/)).toBeInTheDocument()
        expect(screen.getByTestId('historial-pagos')).toBeInTheDocument()
      })
    })
  })

  describe('Diálogos y formularios', () => {
    it('debe cerrar diálogo de nuevo pago al cancelar', async () => {
      const judokas = [createMockJudoka()]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      // Abrir diálogo
      const addButtons = screen.getAllByTestId('AddIcon')
      fireEvent.click(addButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText('Crear Nuevo Pago')).toBeInTheDocument()
      })

      // Cancelar
      fireEvent.click(screen.getByText('Cancelar'))

      await waitFor(() => {
        expect(screen.queryByText('Crear Nuevo Pago')).not.toBeInTheDocument()
      })
    })

    it('debe recargar datos después de crear pago exitosamente', async () => {
      const judokas = [createMockJudoka()]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      // Abrir diálogo
      const addButtons = screen.getAllByTestId('AddIcon')
      fireEvent.click(addButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText('Crear Nuevo Pago')).toBeInTheDocument()
      })

      // Guardar
      fireEvent.click(screen.getByText('Guardar'))

      await waitFor(() => {
        expect(judokaController.getJudokasByClub).toHaveBeenCalledTimes(2) // Initial + refresh
      })
    })

    it('debe recargar datos después de eliminar pago desde lista', async () => {
      const judokas = [createMockJudoka()]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      // Abrir diálogo de pagos
      const visibilityButtons = screen.getAllByTestId('VisibilityIcon')
      fireEvent.click(visibilityButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByTestId('pagos-list')).toBeInTheDocument()
      })

      // Eliminar pago
      fireEvent.click(screen.getByText('Eliminar pago'))

      await waitFor(() => {
        expect(judokaController.getJudokasByClub).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Pago masivo', () => {
    it('debe mostrar botón de pago masivo cuando hay judokas', async () => {
      const judokas = [createMockJudoka()]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Crear Pago para Todos')).toBeInTheDocument()
        expect(screen.getByText('Crear Pago para Todos')).not.toBeDisabled()
      })
    })

    it('debe deshabilitar botón de pago masivo cuando no hay judokas', async () => {
      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Crear Pago para Todos')).toBeDisabled()
      })
    })

    it('debe abrir diálogo de pago masivo', async () => {
      const judokas = [createMockJudoka()]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Crear Pago para Todos'))

      await waitFor(() => {
        expect(screen.getByText('Crear Pago Masivo')).toBeInTheDocument()
        expect(screen.getByTestId('pago-masivo-form')).toBeInTheDocument()
      })
    })

    it('debe recargar datos después de crear pago masivo exitosamente', async () => {
      const judokas = [createMockJudoka()]

      ;(judokaController.getJudokasByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: judokas
      })
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Crear Pago para Todos'))

      await waitFor(() => {
        expect(screen.getByText('Crear Pago Masivo')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Crear Masivo'))

      await waitFor(() => {
        expect(judokaController.getJudokasByClub).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Manejo de errores', () => {
    it('debe manejar error al cargar judokas', async () => {
      ;(judokaController.getJudokasByClub as jest.Mock).mockRejectedValue(
        new Error('Error de red')
      )
      ;(pagoController.getPagosByClub as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<PagosPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error al cargar datos:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('no debe cargar datos si no hay club_id', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, club_id: null }
      })

      render(<PagosPage />)

      await waitFor(() => {
        expect(judokaController.getJudokasByClub).not.toHaveBeenCalled()
        expect(pagoController.getPagosByClub).not.toHaveBeenCalled()
      })
    })
  })
})
