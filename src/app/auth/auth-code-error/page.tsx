'use client'

import { Box, Container, Paper, Typography, Button } from '@mui/material'
import { useRouter } from 'next/navigation'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Typography component="h1" variant="h4" color="error" gutterBottom>
            Error de Autenticación
          </Typography>
          <Typography variant="body1" paragraph>
            Hubo un problema al verificar tu enlace de acceso. Es posible que el enlace haya expirado o ya haya sido utilizado.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/login')}
            sx={{ mt: 2 }}
          >
            Volver al inicio de sesión
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}

