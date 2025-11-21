'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'asociacion' | 'sensei' | 'arbitro' | 'judoka'
  allowedRoles?: ('asociacion' | 'sensei' | 'arbitro' | 'judoka')[]
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Verificar rol si se especifica
      if (requiredRole && user?.rol !== requiredRole) {
        router.push('/')
        return
      }

      // Verificar roles permitidos
      if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
        router.push('/')
        return
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, allowedRoles, router])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Verificando autenticación...
        </Typography>
      </Box>
    )
  }

  // No mostrar contenido si no está autenticado (se redirigirá)
  if (!isAuthenticated) {
    return null
  }

  // Verificar rol
  if (requiredRole && user?.rol !== requiredRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h6" color="error">
          No tienes permisos para acceder a esta página
        </Typography>
      </Box>
    )
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h6" color="error">
          No tienes permisos para acceder a esta página
        </Typography>
      </Box>
    )
  }

  return <>{children}</>
}

