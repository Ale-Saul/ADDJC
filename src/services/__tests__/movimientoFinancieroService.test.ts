import { 
  getAllMovimientos, 
  getMovimientosByDateRange, 
  createMovimiento, 
  getBalance, 
  anularMovimiento,
  getMovimientoById,
  updateMovimiento,
  deleteMovimiento,
  getResumenPorCategoria,
  getMovimientosPorMes
} from '../movimientoFinancieroService';
import { createClient } from '@/lib/supabase/client';

// Mock de Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('MovimientoFinancieroService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    // Default successful responses for chained methods
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.gte.mockReturnValue(mockSupabase);
    mockSupabase.lte.mockReturnValue(mockSupabase);
    mockSupabase.neq.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.single.mockReturnValue(Promise.resolve({ data: null, error: null }));
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const mockResponseItem = {
    id: '1',
    tipo: 'ingreso',
    categoria: 'otro',
    monto: 100,
    concepto: 'Test',
    fecha: '2023-01-01',
    estado: 'registrado',
    activo: true,
    clubes: { nombre_club: 'Club A' },
    usuarios: { correo: 'user@test.com' }
  };

  describe('getAllMovimientos', () => {
    it('debe mapear correctamente los nombres de clubes y correos de usuarios', async () => {
      mockSupabase.order.mockResolvedValue({ data: [mockResponseItem], error: null });

      const result = await getAllMovimientos();

      expect(result[0].origen_club_nombre).toBe('Club A');
      expect(result[0].created_by_email).toBe('user@test.com');
      expect(mockSupabase.from).toHaveBeenCalledWith('movimientos_financieros');
    });

    it('debe manejar errores de Supabase', async () => {
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'Network Error' } });
      await expect(getAllMovimientos()).rejects.toThrow('Error al obtener movimientos financieros');
    });
  });

  describe('getMovimientosByDateRange', () => {
    it('debe filtrar por fechas y estar activo', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });
      await getMovimientosByDateRange('2023-01-01', '2023-01-31');
      expect(mockSupabase.gte).toHaveBeenCalledWith('fecha', '2023-01-01');
      expect(mockSupabase.lte).toHaveBeenCalledWith('fecha', '2023-01-31');
      expect(mockSupabase.eq).toHaveBeenCalledWith('activo', true);
    });
  });

  describe('createMovimiento', () => {
    it('debe insertar un movimiento y devolverlo mapeado', async () => {
      const input = { tipo: 'ingreso' as const, categoria: 'otro' as const, monto: 100, concepto: 'Test', fecha: '2023-01-01' };
      mockSupabase.single.mockResolvedValue({ data: mockResponseItem, error: null });

      const result = await createMovimiento(input, 'user-123');

      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({ created_by: 'user-123' }));
      expect(result.id).toBe('1');
    });
  });

  describe('getBalance', () => {
    it('debe calcular balance sumando ingresos y restando egresos', async () => {
      const mockMovs = [
        { tipo: 'ingreso', monto: 1000 },
        { tipo: 'egreso', monto: 300 },
        { tipo: 'ingreso', monto: 200 }
      ];
      // Para métodos que retornan el objeto de consulta (thenable)
      const mockQuery = {
        then: jest.fn().mockImplementation((callback) => {
          return Promise.resolve(callback({ data: mockMovs, error: null }));
        }),
      };
      mockSupabase.neq.mockReturnValue(mockQuery);

      const result = await getBalance('2023-01-01', '2023-12-31');

      expect(result.total_ingresos).toBe(1200);
      expect(result.total_egresos).toBe(300);
      expect(result.balance).toBe(900);
    });
  });

  describe('getResumenPorCategoria', () => {
    it('debe agrupar movimientos por categoría', async () => {
      const mockMovs = [
        { tipo: 'ingreso', categoria: 'pago_club', monto: 500 },
        { tipo: 'ingreso', categoria: 'pago_club', monto: 500 },
        { tipo: 'egreso', categoria: 'otro', monto: 200 }
      ];
      const mockQuery = {
        then: jest.fn().mockImplementation((callback) => {
          return Promise.resolve(callback({ data: mockMovs, error: null }));
        }),
      };
      mockSupabase.neq.mockReturnValue(mockQuery);

      const result = await getResumenPorCategoria();

      const pagoClub = result.find(r => r.categoria === 'pago_club');
      expect(pagoClub?.total).toBe(1000);
      expect(pagoClub?.cantidad).toBe(2);
    });
  });

  describe('getMovimientosPorMes', () => {
    it('debe agrupar por mes correctamente', async () => {
      const mockMovs = [
        { fecha: '2023-01-15', tipo: 'ingreso', monto: 100 },
        { fecha: '2023-01-20', tipo: 'egreso', monto: 40 },
        { fecha: '2023-02-10', tipo: 'ingreso', monto: 200 }
      ];
      const mockQuery = {
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          return Promise.resolve(callback({ data: mockMovs, error: null }));
        }),
      };
      mockSupabase.order.mockReturnValue(mockQuery);

      const result = await getMovimientosPorMes(2023);

      expect(result).toHaveLength(2);
      expect(result[0].mes).toBe('2023-01');
      expect(result[0].balance).toBe(60);
      expect(result[1].mes).toBe('2023-02');
    });
  });

  describe('updateMovimiento y deleteMovimiento', () => {
    it('updateMovimiento debe ejecutar el update y retornar mapeado', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockResponseItem, error: null });
      await updateMovimiento('1', { concepto: 'Update' });
      expect(mockSupabase.update).toHaveBeenCalledWith({ concepto: 'Update' });
    });

    it('deleteMovimiento debe marcar como activo: false', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null });
      await deleteMovimiento('1');
      expect(mockSupabase.update).toHaveBeenCalledWith({ activo: false });
    });
  });

  describe('Manejo de errores adicionales', () => {
    it('getMovimientoById debe lanzar error si falla Supabase', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'DB Error' } });
      await expect(getMovimientoById('1')).rejects.toThrow('Error al obtener movimiento: DB Error');
    });

    it('updateMovimiento debe lanzar error si falla Supabase', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Update Error' } });
      await expect(updateMovimiento('1', {})).rejects.toThrow('Error al actualizar movimiento: Update Error');
    });

    it('deleteMovimiento debe lanzar error si falla Supabase', async () => {
      mockSupabase.eq.mockResolvedValue({ error: { message: 'Delete Error' } });
      await expect(deleteMovimiento('1')).rejects.toThrow('Error al eliminar movimiento: Delete Error');
    });

    it('getBalance debe lanzar error si falla Supabase', async () => {
      mockSupabase.neq.mockResolvedValue({ data: null, error: { message: 'Balance Error' } });
      await expect(getBalance('2023-01-01', '2023-01-31')).rejects.toThrow('Error al calcular balance: Balance Error');
    });

    it('getResumenPorCategoria debe lanzar error si falla Supabase', async () => {
      mockSupabase.neq.mockResolvedValue({ data: null, error: { message: 'Resumen Error' } });
      await expect(getResumenPorCategoria()).rejects.toThrow('Error al obtener resumen: Resumen Error');
    });

    it('getMovimientosPorMes debe lanzar error si falla Supabase', async () => {
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'Monthly Error' } });
      await expect(getMovimientosPorMes()).rejects.toThrow('Error al obtener movimientos por mes: Monthly Error');
    });
  });

  describe('anularMovimiento', () => {
    it('debe llamar a updateMovimiento con estado anulado', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockResponseItem, error: null });
      await anularMovimiento('1');
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'anulado' }));
    });
  });
});

