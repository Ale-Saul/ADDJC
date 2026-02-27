'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'asociacion' | 'sensei' | 'encargado' | 'arbitro' | 'judoka'
  allowedRoles?: ('admin' | 'asociacion' | 'sensei' | 'encargado' | 'arbitro' | 'judoka')[]
}

// Suscriptor simple para detectar si estamos en el cliente
const emptySubscribe = () => () => {}
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isAuthenticated } = useAuth()
  const isClient = useIsClient()

  useEffect(() => {
    if (isClient && !loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Si debe cambiar la contraseña, redirigir a la página de cambio de contraseña
      if (user?.debe_cambiar_password && pathname !== '/cambiar-password') {
        router.push('/cambiar-password')
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
  }, [isClient, loading, isAuthenticated, user, requiredRole, allowedRoles, router, pathname])

  // No renderizar nada hasta que esté montado en el cliente (evitar flash de hidratación)
  if (!isClient) {
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
          Cargando...
        </Typography>
      </Box>
    )
  }

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
