import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn().mockReturnValue({
      cookies: {
        set: jest.fn(),
      },
    }),
    redirect: jest.fn().mockImplementation((url) => ({
      status: 302,
      url: url.toString(),
    })),
  },
}));

describe('Middleware RBAC Security - Phase 5', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.com';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key';
  });

  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: { pathname },
      url: 'http://localhost' + pathname,
      cookies: {
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      },
    } as unknown as NextRequest;
  };

  it('debe permitir acceso si no hay usuario y no es una ruta protegida (ej: login)', async () => {
    const req = createMockRequest('/login');
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    await middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('debe redireccionar a home si un usuario logueado intenta ir a /login', async () => {
    const req = createMockRequest('/login');
    mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: 'u1', user_metadata: { role: 'sensei' } } } 
    });

    await middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('debe denegar acceso a rutas de asociacion si el usuario es sensei', async () => {
    const req = createMockRequest('/asociacion/dashboard');
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'u1', user_metadata: { role: 'sensei' } } } 
    });

    await middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('debe permitir acceso a rutas de asociacion si el usuario es asociacion', async () => {
    const req = createMockRequest('/asociacion/configuracion');
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'u1', user_metadata: { role: 'asociacion' } } } 
    });

    await middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('debe manejar correctamente el setAll de cookies en el cliente de Supabase', async () => {
    const req = {
      nextUrl: { pathname: '/path' },
      url: 'http://localhost/path',
      cookies: {
        getAll: jest.fn().mockReturnValue([{ name: 'c1', value: 'v1' }]),
        set: jest.fn()
      }
    } as any;
    
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    await middleware(req);

    const lastCall = (createServerClient as jest.Mock).mock.calls[0];
    const cookieHandlers = lastCall[2].cookies;
    
    expect(cookieHandlers.getAll()).toEqual([{ name: 'c1', value: 'v1' }]);

    const cookiesToSet = [{ name: 'sb-token', value: 'secret', options: {} }];
    cookieHandlers.setAll(cookiesToSet);

    expect(req.cookies.set).toHaveBeenCalledWith('sb-token', 'secret');
    expect(NextResponse.next).toHaveBeenCalled();
  });
});
