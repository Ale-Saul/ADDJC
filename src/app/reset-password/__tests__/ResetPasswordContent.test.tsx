import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ResetPasswordContent from '../ResetPasswordContent'
import { authController } from '@/controllers/authController'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

jest.mock('@/controllers/authController', () => ({
  authController: {
    getSession: jest.fn(),
    exchangeCodeForSession: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn()
  }
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

describe('ResetPasswordContent UI - Phase 3', () => {
  const mockPush = jest.fn()
  const mockSignOut = jest.fn()
  const mockSearchParams = { get: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useAuth as jest.Mock).mockReturnValue({ signOut: mockSignOut })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(authController.getSession as jest.Mock).mockResolvedValue({ success: false })
  })

  it('debe mostrar el formulario de solicitud', async () => {
    render(<ResetPasswordContent />)
    await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
    expect(screen.getByText(/Recuperar/i)).toBeInTheDocument()
  })

  it('debe manejar errores de envío', async () => {
    ;(authController.resetPassword as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: 'Email no encontrado' 
    })
    
    render(<ResetPasswordContent />)
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText(/Email/i)
    fireEvent.change(emailInput, { target: { value: 'test@error.com' } })
    
    // El botón se llama  Enviar Email según el log previo
    const submitBtn = screen.getByRole('button', { name: /Enviar/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByText(/Email no encontrado/i)).toBeInTheDocument()
    })
  })

  it('debe cambiar a modo reset si hay una sesión', async () => {
    ;(authController.getSession as jest.Mock).mockResolvedValue({ 
      success: true, 
      data: { session: {} } 
    })

    render(<ResetPasswordContent />)
    await waitFor(() => {
      expect(screen.getByText(/Restablecer/i)).toBeInTheDocument()
    })
  })

  it('debe manejar el flujo exitoso', async () => {
    ;(authController.getSession as jest.Mock).mockResolvedValue({ 
      success: true, 
      data: { session: {} } 
    })
    ;(authController.updatePassword as jest.Mock).mockResolvedValue({ success: true })

    render(<ResetPasswordContent />)
    
    await waitFor(() => {
        expect(screen.getByText(/Restablecer/i)).toBeInTheDocument()
    })

    const passInput = screen.getByLabelText(/Nueva/i)
    const confirmInput = screen.getByLabelText(/Confirmar/i)
    
    fireEvent.change(passInput, { target: { value: 'Password123' } })
    fireEvent.change(confirmInput, { target: { value: 'Password123' } })

    // El botón se llama Cambiar Contraseña en la UI de reset
    const updateBtn = screen.getByRole('button', { name: /Cambiar/i })
    await act(async () => {
      fireEvent.click(updateBtn)
    })

    await waitFor(() => {
      expect(screen.getByText(/actualizada/i)).toBeInTheDocument()
    })
  })
})
