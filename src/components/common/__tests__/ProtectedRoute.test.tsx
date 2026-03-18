import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProtectedRoute from '../ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Mock del contexto de autenticación
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock del router de Next.js
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('ProtectedRoute', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
  })

  describe('Estado de carga', () => {
    it('debe mostrar indicador de carga mientras verifica autenticación', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument()
      expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
    })
  })

  describe('Autenticación', () => {
    it('debe redirigir a login si el usuario no está autenticado', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('debe mostrar el contenido si el usuario está autenticado', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
      })
    })
  })

  describe('Permisos por rol', () => {
    it('debe mostrar contenido si el usuario tiene el rol requerido', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'asociacion',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute requiredRole="asociacion">
          <div>Panel de Asociación</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByText('Panel de Asociación')).toBeInTheDocument()
      })
    })

    it('debe redirigir a home si el usuario no tiene el rol requerido', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute requiredRole="asociacion">
          <div>Panel de Asociación</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('debe mostrar mensaje de error si el usuario no tiene permisos (requiredRole)', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      const { rerender } = render(
        <ProtectedRoute requiredRole="asociacion">
          <div>Panel de Asociación</div>
        </ProtectedRoute>
      )

      // Esperar a que intente redirigir
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })

      // En caso de que no redirija inmediatamente, debería mostrar mensaje de error
      rerender(
        <ProtectedRoute requiredRole="asociacion">
          <div>Panel de Asociación</div>
        </ProtectedRoute>
      )

      // Verificar que el contenido protegido no se muestre
      expect(screen.queryByText('Panel de Asociación')).not.toBeInTheDocument()
    })
  })

  describe('Permisos por lista de roles permitidos', () => {
    it('debe mostrar contenido si el usuario está en la lista de roles permitidos', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'sensei',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute allowedRoles={[ROL.ASOCIACION, ROL.SENSEI, ROL.ENCARGADO]}>
          <div>Panel Administrativo</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByText('Panel Administrativo')).toBeInTheDocument()
      })
    })

    it('debe redirigir a home si el usuario no está en la lista de roles permitidos', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute allowedRoles={[ROL.ASOCIACION, ROL.SENSEI, ROL.ENCARGADO]}>
          <div>Panel Administrativo</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('debe mostrar mensaje de error si el usuario no está en roles permitidos', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      const { rerender } = render(
        <ProtectedRoute allowedRoles={[ROL.ASOCIACION, ROL.SENSEI]}>
          <div>Panel Administrativo</div>
        </ProtectedRoute>
      )

      // Esperar a que intente redirigir
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })

      // Verificar que el contenido protegido no se muestre
      expect(screen.queryByText('Panel Administrativo')).not.toBeInTheDocument()
    })
  })

  describe('Casos especiales', () => {
    it('debe permitir acceso a usuarios de múltiples roles usando allowedRoles', async () => {
      const roles: Array<'asociacion' | 'sensei' | 'encargado' | 'arbitro' | 'judoka'> = [
        'asociacion',
        'sensei',
        'arbitro',
      ]

      for (const rol of roles) {
        mockUseAuth.mockReturnValue({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            nombres: 'Test',
            apellidos: 'User',
            rol,
            activo: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          loading: false,
          isAuthenticated: true,
          signIn: jest.fn(),
          signOut: jest.fn(),
          refreshUser: jest.fn(),
        })

        const { unmount } = render(
          <ProtectedRoute allowedRoles={[ROL.ASOCIACION, ROL.SENSEI, ROL.ARBITRO]}>
            <div>Contenido multi-rol</div>
          </ProtectedRoute>
        )

        await waitFor(() => {
          expect(screen.getByText('Contenido multi-rol')).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('no debe mostrar contenido mientras está en estado de loading', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nombres: 'Test',
          apellidos: 'User',
          rol: 'judoka',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        loading: true,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })

      render(
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      )

      expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
      expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument()
    })
  })
})
