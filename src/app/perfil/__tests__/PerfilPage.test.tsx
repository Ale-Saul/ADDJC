import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PerfilPage from '../PerfilPage'
import { useAuth } from '@/contexts/AuthContext'
import { authController } from '@/controllers/authController'

// Mocks
jest.mock('@/contexts/AuthContext')
jest.mock('@/controllers/authController')
jest.mock('@/components/common/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})
jest.mock('@/components/common/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>
  }
})

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockAuthController = authController as jest.Mocked<typeof authController>

describe('PerfilPage', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    nombres: 'Juan',
    apellidos: 'Pérez',
    rol: 'sensei',
    avatar_url: 'https://example.com/avatar.jpg',
    activo: true,
  }

  const mockRefreshUser = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      refreshUser: mockRefreshUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    })

    // Mock global Image para precargar avatares
    global.Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    } as any
  })

  describe('Renderizado', () => {
    it('debe renderizar la página de perfil correctamente', () => {
      render(<PerfilPage />)

      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
      expect(screen.getByText('Gestiona tu información personal')).toBeInTheDocument()
      expect(screen.getByLabelText(/Nombres/i)).toHaveValue('Juan')
      expect(screen.getByLabelText(/Apellidos/i)).toHaveValue('Pérez')
      expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveValue('test@example.com')
      expect(screen.getByLabelText(/Rol/i)).toHaveValue('Sensei')
    })

    it('debe mostrar el avatar del usuario', () => {
      render(<PerfilPage />)

      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('debe mostrar la inicial si no hay avatar', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, avatar_url: null },
        refreshUser: mockRefreshUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
      })

      render(<PerfilPage />)

      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('debe mostrar loading cuando no hay usuario', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        refreshUser: mockRefreshUser,
        loading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
      })

      render(<PerfilPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('debe deshabilitar campos de email y rol', () => {
      render(<PerfilPage />)

      expect(screen.getByLabelText(/Correo Electrónico/i)).toBeDisabled()
      expect(screen.getByLabelText(/Rol/i)).toBeDisabled()
    })

    it('debe traducir correctamente los roles', () => {
      const roles = [
        { rol: 'asociacion', label: 'Asociación' },
        { rol: 'sensei', label: 'Sensei' },
        { rol: 'encargado', label: 'Encargado' },
        { rol: 'arbitro', label: 'Árbitro' },
        { rol: 'judoka', label: 'Judoka' },
      ]

      roles.forEach(({ rol, label }) => {
        mockUseAuth.mockReturnValue({
          user: { ...mockUser, rol },
          refreshUser: mockRefreshUser,
          loading: false,
          signIn: jest.fn(),
          signOut: jest.fn(),
        })

        const { rerender } = render(<PerfilPage />)
        expect(screen.getByLabelText(/Rol/i)).toHaveValue(label)
        rerender(<div />)
      })
    })
  })

  describe('Actualización de perfil', () => {
    it('debe actualizar el perfil exitosamente', async () => {
      mockAuthController.updateProfile.mockResolvedValue({ success: true })

      render(<PerfilPage />)

      const nombresInput = screen.getByLabelText(/Nombres/i)
      await userEvent.clear(nombresInput)
      await userEvent.type(nombresInput, 'Carlos')

      const apellidosInput = screen.getByLabelText(/Apellidos/i)
      await userEvent.clear(apellidosInput)
      await userEvent.type(apellidosInput, 'González')

      fireEvent.submit(screen.getByRole('button', { name: /Guardar Cambios/i }))

      await waitFor(() => {
        expect(mockAuthController.updateProfile).toHaveBeenCalledWith('123', {
          nombres: 'Carlos',
          apellidos: 'González',
        })
      }, { timeout: 15000 })

      expect(await screen.findByText(/Perfil actualizado correctamente/i, {}, { timeout: 15000 })).toBeInTheDocument()
      expect(mockRefreshUser).toHaveBeenCalled()
    }, 20000)

    it('debe mostrar error al fallar la actualización', async () => {
      mockAuthController.updateProfile.mockResolvedValue({ 
        success: false, 
        error: 'Error al actualizar' 
      })

      render(<PerfilPage />)

      const nombresInput = screen.getByLabelText(/Nombres/i)
      await userEvent.clear(nombresInput)
      await userEvent.type(nombresInput, 'Nuevo')

      fireEvent.submit(screen.getByRole('button', { name: /Guardar Cambios/i }))

      expect(await screen.findByText(/Error al actualizar/i, {}, { timeout: 15000 })).toBeInTheDocument()
    }, 20000)

    it('debe deshabilitar el formulario durante la actualización', async () => {
      let resolveUpdate: (value: any) => void
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve
      })

      mockAuthController.updateProfile.mockImplementation(() => updatePromise)

      render(<PerfilPage />)

      const submitButton = screen.getByRole('button', { name: /Guardar Cambios/i })
      fireEvent.submit(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Guardando.../i })).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(screen.getByLabelText(/Nombres/i)).toBeDisabled()
      expect(screen.getByLabelText(/Apellidos/i)).toBeDisabled()

      resolveUpdate!({ success: true })

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Guardando.../i })).not.toBeInTheDocument()
      }, { timeout: 10000 })
    }, 20000)

    it('debe limpiar mensajes de error al escribir', async () => {
      mockAuthController.updateProfile.mockResolvedValue({ 
        success: false, 
        error: 'Error de prueba' 
      })

      render(<PerfilPage />)

      fireEvent.submit(screen.getByRole('button', { name: /Guardar Cambios/i }))

      await waitFor(() => {
        expect(screen.getByText(/Error de prueba/i)).toBeInTheDocument()
      }, { timeout: 10000 })

      await userEvent.type(screen.getByLabelText(/Nombres/i), ' Modificado')

      await waitFor(() => {
        expect(screen.queryByText(/Error de prueba/i)).not.toBeInTheDocument()
      }, { timeout: 10000 })
    }, 20000)
  })

  describe('Actualización de avatar', () => {
    it('debe subir un avatar exitosamente', async () => {
      const newAvatarUrl = 'https://example.com/new-avatar.jpg'
      mockAuthController.uploadAvatar.mockResolvedValue({ 
        success: true, 
        data: newAvatarUrl 
      })

      render(<PerfilPage />)

      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const input = screen.getByTestId('PhotoCameraIcon').parentElement?.parentElement?.querySelector('input[type="file"]')
      
      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(mockAuthController.uploadAvatar).toHaveBeenCalledWith('123', file)
      }, { timeout: 10000 })

      await waitFor(() => {
        expect(screen.getByText(/Foto de perfil actualizada correctamente/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    }, 20000)

    it('debe rechazar archivos mayores a 2MB', async () => {
      render(<PerfilPage />)

      // Crear archivo mayor a 2MB
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const input = screen.getByTestId('PhotoCameraIcon').parentElement?.parentElement?.querySelector('input[type="file"]')
      
      if (input) {
        await userEvent.upload(input, largeFile)
      }

      await waitFor(() => {
        expect(screen.getByText(/no debe superar los 2MB/i)).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(mockAuthController.uploadAvatar).not.toHaveBeenCalled()
    }, 20000)

    it('debe mostrar error al fallar la subida', async () => {
      mockAuthController.uploadAvatar.mockResolvedValue({ 
        success: false, 
        error: 'Error al subir imagen' 
      })

      render(<PerfilPage />)

      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const input = screen.getByTestId('PhotoCameraIcon').parentElement?.parentElement?.querySelector('input[type="file"]')
      
      if (input) {
        await userEvent.upload(input, file)
      }

      expect(await screen.findByText(/Error al subir imagen/i, {}, { timeout: 10000 })).toBeInTheDocument()
    }, 20000)

    it('debe deshabilitar botón de cámara durante la subida', async () => {
      let resolveUpload: (value: any) => void
      const uploadPromise = new Promise(resolve => {
        resolveUpload = resolve
      })

      mockAuthController.uploadAvatar.mockImplementation(() => uploadPromise)

      render(<PerfilPage />)

      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const input = screen.getByTestId('PhotoCameraIcon').parentElement?.parentElement?.querySelector('input[type="file"]')
      
      if (input) {
        await userEvent.upload(input, file)
      }

      // Verificar que aparece el loading indicator en el botón
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars.length).toBeGreaterThan(0)
      }, { timeout: 10000 })

      resolveUpload!({ success: true, data: 'https://example.com/avatar.jpg' })
    }, 20000)
  })

  describe('Manejo de alertas', () => {
    it('debe poder cerrar alertas de éxito', async () => {
      mockAuthController.updateProfile.mockResolvedValue({ success: true })

      render(<PerfilPage />)

      fireEvent.submit(screen.getByRole('button', { name: /Guardar Cambios/i }))

      const alert = await screen.findByText(/Perfil actualizado correctamente/i, {}, { timeout: 10000 })
      expect(alert).toBeInTheDocument()

      const closeButton = alert.parentElement?.querySelector('button')
      if (closeButton) {
        await userEvent.click(closeButton)
      }

      await waitFor(() => {
        expect(screen.queryByText(/Perfil actualizado correctamente/i)).not.toBeInTheDocument()
      }, { timeout: 10000 })
    }, 20000)

    it('debe poder cerrar alertas de error', async () => {
      mockAuthController.updateProfile.mockResolvedValue({ 
        success: false, 
        error: 'Error de prueba' 
      })

      render(<PerfilPage />)

      fireEvent.submit(screen.getByRole('button', { name: /Guardar Cambios/i }))

      const alert = await screen.findByText(/Error de prueba/i, {}, { timeout: 10000 })
      expect(alert).toBeInTheDocument()

      const closeButton = alert.parentElement?.querySelector('button')
      if (closeButton) {
        await userEvent.click(closeButton)
      }

      await waitFor(() => {
        expect(screen.queryByText(/Error de prueba/i)).not.toBeInTheDocument()
      }, { timeout: 10000 })
    }, 20000)
  })
})
