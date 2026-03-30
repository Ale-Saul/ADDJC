import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReportesAsociacionPage from '../ReportesAsociacionPage'
import { pagoController } from '@/controllers/pagoController'
import { clubController } from '@/controllers/clubController'
import { judokaController } from '@/controllers/judokaController'

// Mock dependencies
jest.mock('@/controllers/pagoController')
jest.mock('@/controllers/clubController')
jest.mock('@/controllers/judokaController')
jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
}))
jest.mock('@/components/common/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}))
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    save: jest.fn()
  }))
})
jest.mock('jspdf-autotable', () => jest.fn())

describe('ReportesAsociacionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Carga inicial y renderizado', () => {
    it('debe mostrar loading mientras carga datos', () => {
      ;(pagoController.getAllPagos as jest.Mock).mockReturnValue(new Promise(() => {}))
      ;(clubController.getAllClubes as jest.Mock).mockReturnValue(new Promise(() => {}))
      ;(judokaController.getAllJudokas as jest.Mock).mockReturnValue(new Promise(() => {}))

      render(<ReportesAsociacionPage />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('debe cargar y mostrar la página de reportes consolidados', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(screen.getByText('Reportes Consolidados - Asociación')).toBeInTheDocument()
      })
    })
  })

  describe('Filtros', () => {
    it('debe mostrar filtros de fecha y club', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(screen.getByText('Filtros')).toBeInTheDocument()
        expect(screen.getByLabelText('Fecha Inicio')).toBeInTheDocument()
        expect(screen.getByLabelText('Fecha Fin')).toBeInTheDocument()
      })
    })

    it('debe mostrar filtros adicionales', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(screen.getByText('Filtros')).toBeInTheDocument()
      })
    })
  })

  describe('Estadísticas generales', () => {
    it('debe mostrar tarjetas de totales generales', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(screen.getByText('TOTAL COBRADO')).toBeInTheDocument()
        expect(screen.getByText('TOTAL PENDIENTE')).toBeInTheDocument()
        expect(screen.getByText('TOTAL VENCIDO')).toBeInTheDocument()
        expect(screen.getByText('CLUBES ACTIVOS')).toBeInTheDocument()
      })
    })
  })

  describe('Vistas de reporte', () => {
    it('debe mostrar vista por club por defecto', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(screen.getByText('Resumen por Club')).toBeInTheDocument()
      })
    })
  })

  describe('Botones de exportación', () => {
    it('debe mostrar botones de exportar PDF y Excel', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(screen.getByText('Exportar a PDF')).toBeInTheDocument()
        expect(screen.getByText('Exportar a Excel')).toBeInTheDocument()
      })
    })

    it('debe deshabilitar botones cuando no hay datos', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(screen.getByText('Exportar a PDF')).toBeDisabled()
        expect(screen.getByText('Exportar a Excel')).toBeDisabled()
      })
    })
  })

  describe('Manejo de errores', () => {
    it('debe manejar error al cargar datos', async () => {
      ;(pagoController.getAllPagos as jest.Mock).mockRejectedValue(
        new Error('Error de red')
      )
      ;(clubController.getAllClubes as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })
      ;(judokaController.getAllJudokas as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<ReportesAsociacionPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error al cargar datos:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })
  })
})
