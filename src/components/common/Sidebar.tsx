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
import { useAuth } from '@/contexts/AuthContext'

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
    const roles: Record<string, string> = {
      asociacion: 'Asociación',
      sensei: 'Sensei',
      encargado: 'Encargado-Sensei',
      arbitro: 'Árbitro',
      judoka: 'Judoka'
    }
    return roles[rol || ''] || rol || 'Usuario'
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
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
      allowedRoles: ['asociacion', 'sensei', 'encargado', 'arbitro', 'judoka'] // Todos los roles
    },
    {
      label: 'Miembros de la Asociación',
      path: '/asociacion',
      icon: <AdminPanelSettingsIcon />,
      allowedRoles: ['asociacion'] // Solo asociación
    }
  ]

  const afiliadosItems = [
    {
      label: 'Clubes',
      path: '/clubes',
      icon: <BusinessIcon />,
      allowedRoles: ['asociacion'] // Solo asociación
    },
    {
      label: 'Árbitros',
      path: '/arbitros',
      icon: <GavelIcon />,
      allowedRoles: ['asociacion', 'arbitro'] // Asociación y árbitros
    },
    {
      label: 'Senseis',
      path: '/senseis',
      icon: <SchoolIcon />,
      allowedRoles: ['asociacion', 'encargado'] // Solo asociación y encargados
    },
    {
      label: 'Judokas',
      path: '/judokas',
      icon: <SportsKabaddiIcon />,
      allowedRoles: ['asociacion', 'sensei', 'judoka', 'encargado'] // Todos excepto árbitros
    }
  ]

  // Filtrar items del menú según los permisos del usuario
  const visibleMenuItems = menuItems.filter(item => hasAccess(item.allowedRoles))
  
  // Filtrar items de afiliados según los permisos del usuario
  const visibleAfiliadosItems = afiliadosItems.filter(item => hasAccess(item.allowedRoles))
  
  // Solo mostrar el menú "Afiliados" si hay al menos un item visible
  const showAfiliadosMenu = visibleAfiliadosItems.length > 0

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
              selected={isActive(item.path)}
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
                    color={user.rol === 'asociacion' ? 'primary' : 'default'}
                  />
                  {user.club_nombre && (user.rol === 'sensei' || user.rol === 'encargado') && (
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

