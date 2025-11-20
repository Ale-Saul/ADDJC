'use client'

import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { useRouter, usePathname } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Clubes', path: '/clubes' },
    { label: 'Árbitros', path: '/arbitros' },
  ]

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Asociación de Judo
        </Typography>
        <Box>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => router.push(item.path)}
              sx={{
                backgroundColor: pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

