import * as movimientoFinancieroController from '../movimientoFinancieroController';
import * as movimientoFinancieroService from '@/services/movimientoFinancieroService';

// Mock del servicio
jest.mock('@/services/movimientoFinancieroService');

describe('MovimientoFinancieroController', () => {
  const mockService = movimientoFinancieroService as jest.Mocked<typeof movimientoFinancieroService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMovimientos', () => {
    it('debe obtener todos los movimientos exitosamente', async () => {
      const mockMovimientos = [
        { id: '1', concepto: 'Ingreso 1', monto: 100, tipo: 'ingreso', categoria: 'mensualidad_club', estado: 'completado' },
        { id: '2', concepto: 'Egreso 1', monto: 50, tipo: 'egreso', categoria: 'servicios_basicos', estado: 'completado' }
      ];
      mockService.getAllMovimientos.mockResolvedValue(mockMovimientos as any);

      const result = await movimientoFinancieroController.getAllMovimientos();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMovimientos);
      expect(mockService.getAllMovimientos).toHaveBeenCalledTimes(1);
    });

    it('debe manejar errores al obtener movimientos', async () => {
      mockService.getAllMovimientos.mockRejectedValue(new Error('DB Error'));

      const result = await movimientoFinancieroController.getAllMovimientos();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudieron obtener los movimientos financieros');
    });
  });

  describe('getMovimientosByDateRange', () => {
    it('debe validar que la fecha de inicio no sea posterior a la de fin', async () => {
      const result = await movimientoFinancieroController.getMovimientosByDateRange('2023-12-31', '2023-01-01');

      expect(result.success).toBe(false);
      expect(result.error).toBe('La fecha de inicio no puede ser posterior a la fecha de fin');
    });

    it('debe validar fechas inválidas', async () => {
      const result = await movimientoFinancieroController.getMovimientosByDateRange('fecha-invalida', '2023-01-01');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Las fechas proporcionadas no son válidas');
    });

    it('debe obtener movimientos por rango de fechas exitosamente', async () => {
      mockService.getMovimientosByDateRange.mockResolvedValue([] as any);

      const result = await movimientoFinancieroController.getMovimientosByDateRange('2023-01-01', '2023-01-31');

      expect(result.success).toBe(true);
      expect(mockService.getMovimientosByDateRange).toHaveBeenCalledWith('2023-01-01', '2023-01-31');
    });
  });

  describe('createMovimiento', () => {
    const validMovimiento = {
      concepto: 'Pago de Luz',
      monto: 150.50,
      tipo: 'egreso' as const,
      categoria: 'servicios_basicos' as any, // Cambiaré a una válida abajo
      fecha: '2023-10-27'
    };

    it('debe crear un movimiento exitosamente', async () => {
      const payload = { ...validMovimiento, categoria: 'gasto_operativo' as const };
      mockService.createMovimiento.mockResolvedValue({ id: 'new-id', ...payload } as any);

      const result = await movimientoFinancieroController.createMovimiento(payload, 'user-123');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-id');
    });

    it('debe validar el esquema Zod (monto negativo)', async () => {
      const invalidMovimiento = { ...validMovimiento, categoria: 'gasto_operativo', monto: -10 };
      
      const result = await movimientoFinancieroController.createMovimiento(invalidMovimiento as any, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('monto');
    });

    it('debe requerir userId', async () => {
      const payload = { ...validMovimiento, categoria: 'gasto_operativo' as const };
      const result = await movimientoFinancieroController.createMovimiento(payload, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
    });

    it('debe validar que para movimientos de club se requiera origen_club_id', async () => {
      const payload = { 
        ...validMovimiento, 
        tipo: 'ingreso' as const, 
        categoria: 'pago_club' as const 
      };
      
      const result = await movimientoFinancieroController.createMovimiento(payload as any, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('club');
    });
  });

  describe('anularMovimiento', () => {
    it('debe anular un movimiento exitosamente', async () => {
      mockService.anularMovimiento.mockResolvedValue({ id: '1', estado: 'anulado' } as any);

      const result = await movimientoFinancieroController.anularMovimiento('1');

      expect(result.success).toBe(true);
      expect(result.data?.estado).toBe('anulado');
      expect(mockService.anularMovimiento).toHaveBeenCalledWith('1');
    });

    it('debe validar ID inválido', async () => {
      const result = await movimientoFinancieroController.anularMovimiento('   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID de movimiento inválido');
    });
  });

  describe('getBalance', () => {
    it('debe calcular el balance correctamente para un periodo', async () => {
      const mockBalance = {
        totalIngresos: 1000,
        totalEgresos: 400,
        balanceNeto: 600,
        periodo: { inicio: '2023-01-01', fin: '2023-01-31' }
      };
      mockService.getBalance.mockResolvedValue(mockBalance as any);

      const result = await movimientoFinancieroController.getBalance('2023-01-01', '2023-01-31');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBalance);
    });

    it('debe fallar si las fechas son inválidas', async () => {
      const result = await movimientoFinancieroController.getBalance('invalid', '2023-01-31');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Las fechas proporcionadas no son válidas');
    });
  });

  describe('getResumenPorCategoria', () => {
    it('debe obtener el resumen por categorías', async () => {
      const mockResumen = [
        { categoria: 'Afiliaciones', total: 500, cantidad: 5, tipo: 'ingreso' },
        { categoria: 'Sueldos', total: 300, cantidad: 1, tipo: 'egreso' }
      ];
      mockService.getResumenPorCategoria.mockResolvedValue(mockResumen as any);

      const result = await movimientoFinancieroController.getResumenPorCategoria();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getMovimientosPorMes', () => {
    it('debe validar el año proporcionado', async () => {
      const result = await movimientoFinancieroController.getMovimientosPorMes(1999);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Año no válido');
    });

    it('debe obtener la evolución mensual exitosamente', async () => {
      mockService.getMovimientosPorMes.mockResolvedValue([] as any);
      const result = await movimientoFinancieroController.getMovimientosPorMes(2023);
      expect(result.success).toBe(true);
      expect(mockService.getMovimientosPorMes).toHaveBeenCalledWith(2023);
    });

    it('debe manejar errores del servicio en getMovimientosPorMes', async () => {
      mockService.getMovimientosPorMes.mockRejectedValue(new Error('DB Error'));
      const result = await movimientoFinancieroController.getMovimientosPorMes(2023);
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo obtener los movimientos por mes');
    });
  });

  describe('updateMovimiento', () => {
    it('debe actualizar un movimiento exitosamente', async () => {
      const updates = { concepto: 'Concepto Actualizado' };
      mockService.updateMovimiento.mockResolvedValue({ id: '1', ...updates } as any);
      const result = await movimientoFinancieroController.updateMovimiento('1', updates);
      expect(result.success).toBe(true);
      expect(result.data?.concepto).toBe('Concepto Actualizado');
    });

    it('debe validar ID inválido en update', async () => {
      const result = await movimientoFinancieroController.updateMovimiento('', {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID de movimiento inválido');
    });

    it('debe manejar errores del servicio en update', async () => {
      mockService.updateMovimiento.mockRejectedValue(new Error('Update Error'));
      const result = await movimientoFinancieroController.updateMovimiento('1', { monto: 100 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo actualizar el movimiento financiero');
    });
  });

  describe('deleteMovimiento', () => {
    it('debe eliminar un movimiento exitosamente', async () => {
      mockService.deleteMovimiento.mockResolvedValue(undefined);
      const result = await movimientoFinancieroController.deleteMovimiento('1');
      expect(result.success).toBe(true);
    });

    it('debe manejar errores del servicio en delete', async () => {
      mockService.deleteMovimiento.mockRejectedValue(new Error('Delete Error'));
      const result = await movimientoFinancieroController.deleteMovimiento('1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo eliminar el movimiento financiero');
    });
  });

  describe('getMovimientoById', () => {
    it('debe obtener un movimiento por ID', async () => {
      mockService.getMovimientoById.mockResolvedValue({ id: '1', concepto: 'Test' } as any);
      const result = await movimientoFinancieroController.getMovimientoById('1');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('1');
    });

    it('debe retornar error si no existe', async () => {
      mockService.getMovimientoById.mockResolvedValue(null as any);
      const result = await movimientoFinancieroController.getMovimientoById('999');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Movimiento no encontrado');
    });
  });

  describe('getBalance errores detallados', () => {
    it('debe manejar errores de base de datos en getBalance', async () => {
      mockService.getBalance.mockRejectedValue(new Error('Balance Error'));
      const result = await movimientoFinancieroController.getBalance('2023-01-01', '2023-01-31');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo calcular el balance');
    });

    it('debe validar que la fecha de inicio no sea posterior a la de fin en getBalance', async () => {
      const result = await movimientoFinancieroController.getBalance('2023-12-31', '2023-01-01');
      expect(result.success).toBe(false);
      expect(result.error).toBe('La fecha de inicio no puede ser posterior a la fecha de fin');
    });
  });

  describe('getResumenPorCategoria errores adicionales', () => {
    it('debe manejar errores del servicio en getResumenPorCategoria', async () => {
      mockService.getResumenPorCategoria.mockRejectedValue(new Error('Resumen Error'));
      const result = await movimientoFinancieroController.getResumenPorCategoria();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo obtener el resumen por categoría');
    });

    it('debe validar que las fechas sean válidas en getResumenPorCategoria', async () => {
      const result = await movimientoFinancieroController.getResumenPorCategoria('fecha-invalida', '2023-01-31');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Las fechas proporcionadas no son válidas');
    });
  });

  describe('anularMovimiento errores adicionales', () => {
    it('debe manejar errores del servicio en anularMovimiento', async () => {
      mockService.anularMovimiento.mockRejectedValue(new Error('Anular Error'));
      const result = await movimientoFinancieroController.anularMovimiento('1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo anular el movimiento financiero');
    });
  });

  describe('casos de error en getMovimientosByDateRange', () => {
    it('debe manejar errores del servicio en getMovimientosByDateRange', async () => {
      mockService.getMovimientosByDateRange.mockRejectedValue(new Error('DB Error Range'));
      const result = await movimientoFinancieroController.getMovimientosByDateRange('2023-01-01', '2023-01-31');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudieron obtener los movimientos financieros');
    });
  });

  describe('casos de error en createMovimiento', () => {
    it('debe manejar errores del servicio en createMovimiento', async () => {
      const payload = { concepto: 'Test', monto: 10, tipo: 'ingreso' as const, categoria: 'otro' as const, fecha: '2023-01-01' };
      mockService.createMovimiento.mockRejectedValue(new Error('Create Error DB'));
      const result = await movimientoFinancieroController.createMovimiento(payload, 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo crear el movimiento financiero');
    });
  });

  describe('casos de error en getMovimientoById', () => {
    it('debe manejar errores del servicio en getMovimientoById', async () => {
      mockService.getMovimientoById.mockRejectedValue(new Error('ID Error DB'));
      const result = await movimientoFinancieroController.getMovimientoById('1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No se pudo obtener el movimiento financiero');
    });

    it('debe validar ID nulo o vacío en getMovimientoById', async () => {
      const result = await movimientoFinancieroController.getMovimientoById(' ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID de movimiento inválido');
    });
  });
});
