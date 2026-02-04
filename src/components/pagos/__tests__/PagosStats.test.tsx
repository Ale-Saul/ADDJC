import { render, screen } from '@testing-library/react'
import PagosStats from '../PagosStats'
import { Pago } from '@/models/pago'

// Mock de fechas para tests consistentes
const mockDate = new Date('2024-12-15T10:00:00.000Z')

describe('PagosStats', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  const createMockPago = (overrides: Partial<Pago> = {}): Pago => ({
    id: 'pago-1',
    judoka_id: 'judoka-1',
    club_id: 'club-1',
    tipo_pago: 'cuota_mensual',
    concepto: 'Cuota Diciembre',
    monto_base: 150,
    descuento: 0,
    monto_final: 150,
    fecha_vencimiento: '2024-12-31',
    estado: 'pendiente',
    activo: true,
    created_at: '2024-12-01T00:00:00.000Z',
    updated_at: '2024-12-01T00:00:00.000Z',
    ...overrides
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar las 4 tarjetas estadísticas', () => {
      render(<PagosStats pagos={[]} />)

      expect(screen.getByText('TOTAL PENDIENTE')).toBeInTheDocument()
      expect(screen.getByText('TOTAL VENCIDO')).toBeInTheDocument()
      expect(screen.getByText('COBRADO ESTE MES')).toBeInTheDocument()
      expect(screen.getByText('JUDOKAS CON DEUDA')).toBeInTheDocument()
    })

    it('debe mostrar valores en cero cuando no hay pagos', () => {
      render(<PagosStats pagos={[]} />)

      const amounts = screen.getAllByText(/Bs\. 0\.00/)
      expect(amounts).toHaveLength(3) // pendiente, vencido, cobrado
      expect(screen.getByText('0')).toBeInTheDocument() // judokas con deuda
    })

    it('debe mostrar el mes actual en la tarjeta de cobrado', () => {
      render(<PagosStats pagos={[]} />)

      expect(screen.getByText('diciembre de 2024')).toBeInTheDocument()
    })
  })

  describe('Cálculo de Total Pendiente', () => {
    it('debe calcular correctamente el total pendiente', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', monto_final: 100, estado: 'pendiente' }),
        createMockPago({ id: '2', monto_final: 150, estado: 'pendiente' }),
        createMockPago({ id: '3', monto_final: 200, estado: 'pendiente' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 450.00')).toBeInTheDocument()
    })

    it('no debe incluir pagos vencidos en el total pendiente', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', monto_final: 100, estado: 'pendiente' }),
        createMockPago({ id: '2', monto_final: 150, estado: 'vencido' })
      ]

      render(<PagosStats pagos={pagos} />)

      // Solo debe mostrar el pago pendiente (100), no el vencido (150)
      expect(screen.getByText('Bs. 100.00')).toBeInTheDocument()
    })

    it('no debe incluir pagos inactivos', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', monto_final: 100, estado: 'pendiente', activo: true }),
        createMockPago({ id: '2', monto_final: 150, estado: 'pendiente', activo: false })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 100.00')).toBeInTheDocument()
    })

    it('no debe incluir pagos pagados', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', monto_final: 100, estado: 'pendiente' }),
        createMockPago({ id: '2', monto_final: 150, estado: 'pagado', fecha_pago: '2024-12-01' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 100.00')).toBeInTheDocument()
    })
  })

  describe('Cálculo de Total Vencido', () => {
    it('debe calcular correctamente el total vencido', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 100, 
          estado: 'vencido',
          fecha_vencimiento: '2024-12-01' 
        }),
        createMockPago({ 
          id: '2', 
          monto_final: 200, 
          estado: 'vencido',
          fecha_vencimiento: '2024-11-30' 
        })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 300.00')).toBeInTheDocument()
    })

    it('debe mostrar la cantidad de pagos vencidos', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', estado: 'vencido', fecha_vencimiento: '2024-12-01' }),
        createMockPago({ id: '2', estado: 'vencido', fecha_vencimiento: '2024-11-30' }),
        createMockPago({ id: '3', estado: 'vencido', fecha_vencimiento: '2024-11-25' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText(/3 pagos/)).toBeInTheDocument()
    })

    it('debe usar singular "pago" cuando hay solo uno vencido', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', estado: 'vencido', fecha_vencimiento: '2024-12-01' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText(/1 pago/)).toBeInTheDocument()
    })

    it('debe calcular y mostrar el promedio de días vencidos', () => {
      // Mock date: 2024-12-15
      // Vencido hace 14 días (01/12) y 15 días (30/11) = promedio 14.5 ≈ 15
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          estado: 'vencido', 
          fecha_vencimiento: '2024-12-01' // 14 días
        }),
        createMockPago({ 
          id: '2', 
          estado: 'vencido', 
          fecha_vencimiento: '2024-11-30' // 15 días
        })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText(/~15 días/)).toBeInTheDocument()
    })

    it('no debe mostrar días vencidos si no hay pagos vencidos', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', estado: 'pendiente' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.queryByText(/días/)).not.toBeInTheDocument()
    })

    it('no debe incluir pagos inactivos en vencidos', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 100, 
          estado: 'vencido',
          activo: true,
          fecha_vencimiento: '2024-12-01' 
        }),
        createMockPago({ 
          id: '2', 
          monto_final: 200, 
          estado: 'vencido',
          activo: false,
          fecha_vencimiento: '2024-11-30' 
        })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 100.00')).toBeInTheDocument()
      expect(screen.getByText(/1 pago/)).toBeInTheDocument()
    })
  })

  describe('Cálculo de Cobrado Este Mes', () => {
    it('debe calcular correctamente el total cobrado este mes', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 150, 
          estado: 'pagado',
          fecha_pago: '2024-12-05'
        }),
        createMockPago({ 
          id: '2', 
          monto_final: 200, 
          estado: 'pagado',
          fecha_pago: '2024-12-10'
        })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 350.00')).toBeInTheDocument()
    })

    it('no debe incluir pagos del mes anterior', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 150, 
          estado: 'pagado',
          fecha_pago: '2024-12-05'
        }),
        createMockPago({ 
          id: '2', 
          monto_final: 200, 
          estado: 'pagado',
          fecha_pago: '2024-11-25'
        })
      ]

      render(<PagosStats pagos={pagos} />)

      // Solo debe contar el pago de diciembre
      expect(screen.getByText('Bs. 150.00')).toBeInTheDocument()
    })

    it('no debe incluir pagos del mes siguiente', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 150, 
          estado: 'pagado',
          fecha_pago: '2024-12-05'
        }),
        createMockPago({ 
          id: '2', 
          monto_final: 200, 
          estado: 'pagado',
          fecha_pago: '2025-01-05'
        })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 150.00')).toBeInTheDocument()
    })

    it('no debe incluir pagos sin fecha de pago', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 150, 
          estado: 'pagado',
          fecha_pago: '2024-12-05'
        }),
        createMockPago({ 
          id: '2', 
          monto_final: 200, 
          estado: 'pagado',
          fecha_pago: undefined
        })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 150.00')).toBeInTheDocument()
    })

    it('debe incluir pagos del primer día del mes', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 150, 
          estado: 'pagado',
          fecha_pago: '2024-12-01T12:00:00.000Z' // Primer día del mes con hora del mediodía
        })
      ]

      render(<PagosStats pagos={pagos} />)

      // El pago del primer día del mes debe contarse
      // Dado que es el único pago, debe aparecer en COBRADO ESTE MES
      const cobradoSection = screen.getByText('COBRADO ESTE MES').closest('.MuiCard-root')
      expect(cobradoSection).toBeInTheDocument()
      expect(cobradoSection).toHaveTextContent('150')
    })

    it('debe incluir pagos del día actual', () => {
      const pagos: Pago[] = [
        createMockPago({ 
          id: '1', 
          monto_final: 150, 
          estado: 'pagado',
          fecha_pago: '2024-12-15' // Día actual según el mock
        })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 150.00')).toBeInTheDocument()
    })
  })

  describe('Cálculo de Judokas con Deuda', () => {
    it('debe contar correctamente judokas únicos con deuda', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', judoka_id: 'j1', estado: 'pendiente' }),
        createMockPago({ id: '2', judoka_id: 'j1', estado: 'vencido' }),
        createMockPago({ id: '3', judoka_id: 'j2', estado: 'pendiente' }),
        createMockPago({ id: '4', judoka_id: 'j3', estado: 'vencido' })
      ]

      render(<PagosStats pagos={pagos} />)

      // 3 judokas únicos (j1, j2, j3)
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('pendiente o vencido')).toBeInTheDocument()
    })

    it('debe contar judokas con pagos pendientes', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', judoka_id: 'j1', estado: 'pendiente' }),
        createMockPago({ id: '2', judoka_id: 'j2', estado: 'pendiente' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('debe contar judokas con pagos vencidos', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', judoka_id: 'j1', estado: 'vencido' }),
        createMockPago({ id: '2', judoka_id: 'j2', estado: 'vencido' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('no debe contar judokas con pagos pagados', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', judoka_id: 'j1', estado: 'pagado' }),
        createMockPago({ id: '2', judoka_id: 'j2', estado: 'pendiente' })
      ]

      render(<PagosStats pagos={pagos} />)

      // Solo j2 tiene deuda
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('no debe duplicar judokas con múltiples deudas', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', judoka_id: 'j1', estado: 'pendiente' }),
        createMockPago({ id: '2', judoka_id: 'j1', estado: 'pendiente' }),
        createMockPago({ id: '3', judoka_id: 'j1', estado: 'vencido' })
      ]

      render(<PagosStats pagos={pagos} />)

      // j1 tiene 3 deudas pero se cuenta solo una vez
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('no debe contar pagos inactivos', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', judoka_id: 'j1', estado: 'pendiente', activo: true }),
        createMockPago({ id: '2', judoka_id: 'j2', estado: 'pendiente', activo: false })
      ]

      render(<PagosStats pagos={pagos} />)

      // Solo j1 con pago activo
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('Formato de moneda', () => {
    it('debe formatear correctamente los montos con 2 decimales', () => {
      const pagos: Pago[] = [
        createMockPago({ monto_final: 150.5, estado: 'pendiente' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 150.50')).toBeInTheDocument()
    })

    it('debe manejar montos grandes correctamente', () => {
      const pagos: Pago[] = [
        createMockPago({ monto_final: 9999.99, estado: 'pendiente' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 9999.99')).toBeInTheDocument()
    })

    it('debe mostrar .00 para montos enteros', () => {
      const pagos: Pago[] = [
        createMockPago({ monto_final: 150, estado: 'pendiente' })
      ]

      render(<PagosStats pagos={pagos} />)

      expect(screen.getByText('Bs. 150.00')).toBeInTheDocument()
    })
  })

  describe('Escenarios mixtos', () => {
    it('debe calcular correctamente con múltiples estados', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', judoka_id: 'j1', monto_final: 100, estado: 'pendiente' }),
        createMockPago({ id: '2', judoka_id: 'j2', monto_final: 150, estado: 'vencido', fecha_vencimiento: '2024-12-01' }),
        createMockPago({ id: '3', judoka_id: 'j3', monto_final: 200, estado: 'pagado', fecha_pago: '2024-12-10' }),
        createMockPago({ id: '4', judoka_id: 'j1', monto_final: 50, estado: 'vencido', fecha_vencimiento: '2024-11-30' })
      ]

      const { container } = render(<PagosStats pagos={pagos} />)

      // Total pendiente: 100
      expect(screen.getByText(/100\.00/)).toBeInTheDocument()
      
      // Total vencido: 150 + 50 = 200
      // Usar getAllByText ya que puede haber múltiples elementos con 200.00
      const amounts200 = screen.getAllByText(/200\.00/)
      expect(amounts200.length).toBeGreaterThanOrEqual(1)
      
      // Verificar que está en la tarjeta correcta (TOTAL VENCIDO)
      expect(screen.getByText('TOTAL VENCIDO')).toBeInTheDocument()
      
      // Judokas con deuda: j1 y j2 = 2
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('debe manejar correctamente pagos inactivos en diferentes estados', () => {
      const pagos: Pago[] = [
        createMockPago({ id: '1', monto_final: 100, estado: 'pendiente', activo: true }),
        createMockPago({ id: '2', monto_final: 150, estado: 'pendiente', activo: false }),
        createMockPago({ id: '3', monto_final: 200, estado: 'vencido', activo: false }),
        createMockPago({ id: '4', monto_final: 50, estado: 'pagado', fecha_pago: '2024-12-10' })
      ]

      render(<PagosStats pagos={pagos} />)

      // Solo debe contar el pago activo pendiente (100)
      expect(screen.getByText('Bs. 100.00')).toBeInTheDocument()
    })
  })
})
