'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authController } from '@/controllers/authController'
import { User, LoginCredentials } from '@/models/auth'
import { ApiResponse } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<ApiResponse<any>>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar usuario al montar el componente
  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      const response = await authController.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        setUser(null)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar usuario:', error)
      setUser(null)
      setLoading(false)
    }
  }

  const signIn = async (credentials: LoginCredentials) => {
    const response = await authController.signIn(credentials)
    if (response.success && response.data) {
      // Reload full profile via getCurrentUser so club_id and other
      // role-specific fields are always fetched from a fresh session.
      await loadUser()
    }
    return response
  }

  const signOut = async () => {
    const response = await authController.signOut()
    if (response.success) {
      setUser(null)
    }
  }

  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

