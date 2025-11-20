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
  useTheme
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

const DRAWER_WIDTH = 280

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const [openAfiliados, setOpenAfiliados] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
    setOpenAfiliados(true)
  }, [])

  const handleAfiliadosClick = () => {
    setOpenAfiliados(!openAfiliados)
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const menuItems = [
    {
      label: 'Inicio',
      path: '/',
      icon: <HomeIcon />
    }
  ]

  const afiliadosItems = [
    {
      label: 'Clubes',
      path: '/clubes',
      icon: <BusinessIcon />
    },
    {
      label: 'Árbitros',
      path: '/arbitros',
      icon: <GavelIcon />
    },
    {
      label: 'Senseis',
      path: '/senseis',
      icon: <SchoolIcon />
    },
    {
      label: 'Judokas',
      path: '/judokas',
      icon: <SportsKabaddiIcon />
    }
  ]

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
            position: 'relative',
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
        {menuItems.map((item) => (
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
            {afiliadosItems.map((item) => (
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
      </List>
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
          position: 'relative',
          height: '100vh',
          overflow: 'hidden'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

