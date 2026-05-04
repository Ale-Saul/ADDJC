'use client'

import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material'
import Sidebar from './Sidebar'
import NotificationBell from '@/components/comunicacion/NotificationBell'
import { useAuth } from '@/contexts/AuthContext'

const DRAWER_WIDTH = 280

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        {/* TopBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar variant="dense" sx={{ justifyContent: 'space-between', minHeight: 48 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {user?.club_nombre
                ? `Club ${user.club_nombre}`
                : 'Asociación Departamental de Judo'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {user?.id && (
                <NotificationBell usuarioId={user.id} />
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Contenido principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? '#f5f5f5' : theme.palette.background.default,
          }}
        >
          <Container maxWidth="xl">
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  )
}
