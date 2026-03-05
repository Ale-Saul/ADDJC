'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  useTheme,
  Button,
  Avatar,
  Chip
} from '@mui/material'
import { useRouter, usePathname } from 'next/navigation'
import HomeIcon from '@mui/icons-material/Home'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import GroupsIcon from '@mui/icons-material/Groups'
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi'
import SchoolIcon from '@mui/icons-material/School'
import GavelIcon from '@mui/icons-material/Gavel'
import BusinessIcon from '@mui/icons-material/Business'
import LogoutIcon from '@mui/icons-material/Logout'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PaymentIcon from '@mui/icons-material/Payment'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

const DRAWER_WIDTH = 280

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const { user, signOut } = useAuth()
  const [openAfiliados, setOpenAfiliados] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // El menú Afiliados comienza cerrado por defecto
  }, [])

  const handleAfiliadosClick = () => {
    setOpenAfiliados(!openAfiliados)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const getRoleLabel = (rol?: string) => {
    const labels: Record<string, string> = {
      [ROL.ADMIN]: 'Administrador',
      [ROL.ASOCIACION]: 'Asociación',
      [ROL.SENSEI]: 'Sensei',
      [ROL.ENCARGADO]: 'Encargado-Sensei',
      [ROL.ARBITRO]: 'Árbitro',
      [ROL.JUDOKA]: 'Judoka',
    }
    return labels[rol || ''] || rol || 'Usuario'
  }

  const isActive = (path: string, allPaths?: string[]) => {
    if (!pathname) return false
    // Coincidencia exacta siempre es activa
    if (pathname === path) return true
    // Para subrutas, verificar que empiece con path + '/'
    // Pero solo si no hay otra ruta más específica que coincida exactamente
    if (pathname.startsWith(path + '/')) {
      // Si hay una lista de rutas, verificar que no haya una más específica que coincida exactamente
      if (allPaths) {
        const exactMatch = allPaths.find(p => p !== path && pathname === p)
        if (exactMatch) return false // Hay una ruta más específica que coincide exactamente
      }
      return true
    }
    return false
  }

  // Función para verificar si el usuario tiene acceso a una ruta
  const hasAccess = (allowedRoles: string[]) => {
    if (!user) return false
    return allowedRoles.includes(user.rol)
  }

  const menuItems = [
    {
      label: 'Inicio',
      path: '/',
      icon: <HomeIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION, ROL.SENSEI, ROL.ENCARGADO, ROL.ARBITRO, ROL.JUDOKA] // Todos los roles
    },
    {
      label: 'Miembros de la Asociación',
      path: '/asociacion',
      icon: <AdminPanelSettingsIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION] // Admin y asociación
    },
    {
      label: 'Pagos y Cuotas',
      path: '/pagos',
      icon: <PaymentIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ENCARGADO] // Admin y encargados
    },
    {
      label: 'Reportes',
      path: '/reportes',
      icon: <AssessmentIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ENCARGADO] // Admin y encargados
    },
    {
      label: 'Reportes Asociación',
      path: '/reportes/asociacion',
      icon: <AssessmentIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION] // Admin y asociación
    },
    {
      label: 'Contabilidad',
      path: '/contabilidad',
      icon: <AccountBalanceIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION] // Admin y asociación
    }
  ]

  const afiliadosItems = [
    {
      label: 'Clubes',
      path: '/clubes',
      icon: <BusinessIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION, ROL.JUDOKA, ROL.SENSEI, ROL.ENCARGADO, ROL.ARBITRO] // Admin, asociación, judokas, senseis, encargados y árbitros (solo lectura)
    },
    {
      label: 'Árbitros',
      path: '/arbitros',
      icon: <GavelIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION, ROL.ARBITRO, ROL.SENSEI, ROL.ENCARGADO]
    },
    {
      label: 'Senseis',
      path: '/senseis',
      icon: <SchoolIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION, ROL.ENCARGADO, ROL.SENSEI] // Admin, asociación, encargados y senseis (solo lectura)
    },
    {
      label: 'Judokas',
      path: '/judokas',
      icon: <SportsKabaddiIcon />,
      allowedRoles: [ROL.ADMIN, ROL.ASOCIACION, ROL.SENSEI, ROL.JUDOKA, ROL.ENCARGADO] // Todos excepto árbitros
    }
  ]

  // Filtrar items del menú según los permisos del usuario
  const visibleMenuItems = menuItems.filter(item => hasAccess(item.allowedRoles))
  
  // Filtrar items de afiliados según los permisos del usuario
  const visibleAfiliadosItems = afiliadosItems.filter(item => hasAccess(item.allowedRoles))
  
  // Solo mostrar el menú "Afiliados" si hay al menos un item visible
  const showAfiliadosMenu = visibleAfiliadosItems.length > 0
  
  // Obtener todas las rutas del menú para la función isActive
  const allMenuPaths = visibleMenuItems.map(item => item.path)

  // Evitar renderizar hasta que esté montado en el cliente
  if (!mounted) {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            position: 'fixed',
            height: '100vh',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ width: DRAWER_WIDTH, height: '100%' }} />
      </Drawer>
    )
  }

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 1.5, backgroundColor: theme.palette.primary.main, color: 'white', flexShrink: 0 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          Asociación de Judo
        </Typography>
      </Box>
      <Divider />
      <List sx={{ pt: 0.5, flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Inicio */}
        {visibleMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActive(item.path, allMenuPaths)}
              onClick={() => router.push(item.path)}
              sx={{
                py: 1,
                minHeight: 40,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.16)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.text.primary
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ fontSize: '0.9rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Mostrar menú Afiliados solo si hay items visibles */}
        {showAfiliadosMenu && (
          <>
            <Divider sx={{ my: 0.5 }} />

            {/* Afiliados - Menú colapsable */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={handleAfiliadosClick}
                sx={{ 
                  py: 1, 
                  minHeight: 40,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <GroupsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Afiliados" 
                  primaryTypographyProps={{ fontSize: '0.9rem' }}
                />
                {openAfiliados ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={openAfiliados} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {visibleAfiliadosItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => router.push(item.path)}
                  sx={{
                    pl: 3.5,
                    py: 0.75,
                    minHeight: 36,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.16)'
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.text.primary
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                  />
                </ListItemButton>
                </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>

      {/* Información del usuario y logout */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        {user && (
          <>
            <Box 
              onClick={() => router.push('/perfil')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1.5,
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 1,
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Avatar 
                src={user.avatar_url || undefined}
                sx={{ width: 32, height: 32, mr: 1, bgcolor: theme.palette.primary.main }}
              >
                {user.nombres.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.nombres} {user.apellidos}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                  <Chip 
                    label={getRoleLabel(user.rol)} 
                    size="small" 
                    sx={{ height: 18, fontSize: '0.65rem', cursor: 'pointer', alignSelf: 'flex-start' }}
                    color={user.rol === ROL.ADMIN || user.rol === ROL.ASOCIACION ? 'primary' : 'default'}
                  />
                  {user.club_nombre && (user.rol === ROL.SENSEI || user.rol === ROL.ENCARGADO || user.rol === ROL.JUDOKA) && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        color: 'text.secondary',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: '0.75rem' }} />
                      {user.club_nombre}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ mt: 1 }}
            >
              Cerrar Sesión
            </Button>
          </>
        )}
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          position: 'fixed',
          height: '100vh',
          overflow: 'hidden'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

