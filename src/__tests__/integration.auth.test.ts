import { authController } from '@/controllers/authController';
import { authService } from '@/services/authService';
import { NextResponse } from 'next/server';
import { middleware } from '@/middleware';

// Mock del servicio directamente para la prueba de integración de 'flujo'
jest.mock('@/services/authService', () => ({
  authService: {
    signIn: jest.fn(),
    updateProfile: jest.fn(),
  }
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn(),
    }
  }),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn().mockReturnValue({ cookies: { set: jest.fn() } }),
    redirect: jest.fn().mockImplementation((url) => ({ status: 302, url: url.toString() })),
  },
}));

describe('Integración: Flujos Críticos de Seguridad (Fase 6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Flujo Integrado: Controladores y Seguridad del Middleware', async () => {
    // 1. Simular Login Exitoso en Controlador (via Servicio)
    (authService.signIn as jest.Mock).mockResolvedValue({
      success: true,
      data: { user: { id: 'u1', email: 'v@v.com', activo: true } }
    });

    const loginRes = await authController.signIn({ email: 'v@v.com', password: 'Password123' });
    expect(loginRes.success).toBe(true);

    // 2. Simular Middleware protegiendo rutas tras login
    const { createServerClient } = require('@supabase/ssr');
    (createServerClient().auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'u1', user_metadata: { role: 'judoka' } } }
    });

    const req = {
      nextUrl: { pathname: '/asociacion/dashboard' },
      url: 'http://localhost/asociacion/dashboard',
      cookies: { getAll: jest.fn().mockReturnValue([]), set: jest.fn() }
    } as any;

    await middleware(req);
    // El judoka no puede entrar a asociacion
    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('Flujo Integrado: Actualización de Perfil', async () => {
    (authService.updateProfile as jest.Mock).mockResolvedValue({ success: true });
    
    const res = await authController.updateProfile('u1', { nombre: 'Test' });
    expect(res.success).toBe(true);
  });
});
