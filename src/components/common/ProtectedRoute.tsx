'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/constants/roles'
import { hasRoleAccess } from '@/utils/roleAccess'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const userHasAccess = user && (
    !allowedRoles ||
    hasRoleAccess(user, allowedRoles, pathname ?? undefined)
  )

  // Evitar problemas de hidratación - solo renderizar en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Si debe cambiar la contraseña, redirigir a la página de cambio de contraseña
      // Pero permitir el acceso a la propia página de cambio de contraseña
      if (user?.debe_cambiar_password && window.location.pathname !== '/cambiar-password') {
        router.push('/cambiar-password')
        return
      }

      // Verificar rol si se especifica
      if (requiredRole && user?.rol !== requiredRole) {
        router.push('/')
        return
      }

      // Verificar roles permitidos (incluye multi-cargo)
      if (allowedRoles && user && !hasRoleAccess(user, allowedRoles, pathname ?? undefined)) {
        router.push('/')
        return
      }
    }
  }, [mounted, loading, isAuthenticated, user, requiredRole, allowedRoles, router, pathname])

  // No renderizar nada hasta que esté montado en el cliente
  if (!mounted) {
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

  if (allowedRoles && user && !userHasAccess) {
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

