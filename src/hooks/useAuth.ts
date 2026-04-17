/**
 * Hook personalizado para manejo de autenticación
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authController } from '@/controllers/authController'
import { User, LoginCredentials, SignUpData } from '@/models/auth'
import { ROUTES } from '@/constants/globales'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setIsLoading(true)
    const response = await authController.getCurrentUser()
    
    if (response.success && response.data) {
      setUser(response.data)
    } else {
      setUser(null)
    }
    
    setIsLoading(false)
  }

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)

    const response = await authController.signIn(credentials)

    if (response.success && response.data) {
      router.push('/login?registered=true')
      return { success: true }
    } else {
      setError(response.error || 'Error al iniciar sesión')
      return { success: false, error: response.error }
    }
  }

  const logout = async () => {
    setIsLoading(true)
    const response = await authController.signOut()
    
    if (response.success) {
      setUser(null)
      router.push(ROUTES.LOGIN)
    }
    
    setIsLoading(false)
  }

  const signup = async (data: SignUpData) => {
    setIsLoading(true)
    setError(null)

    const response = await authController.signUp(data)

    if (response.success && response.data) {
      router.push('/login?registered=true')
      return { success: true }
    } else {
      setError(response.error || 'Error al crear cuenta')
      return { success: false, error: response.error }
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { success: false, error: 'No hay usuario autenticado' }

    setIsLoading(true)
    const response = await authController.updateProfile(user.id, updates)

    if (response.success && response.data) {
      setUser(response.data)
      return { success: true }
    } else {
      return { success: false, error: response.error }
    }
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    updateProfile,
    checkAuth,
  }
}



