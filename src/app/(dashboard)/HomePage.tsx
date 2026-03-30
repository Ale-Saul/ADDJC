'use client'

import { Box, Typography, Button } from '@mui/material'
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <Box textAlign="center" py={8}>
      <SportsKabaddiIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        Asociación de Judo
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph>
        Sistema de Gestión de Afiliados
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push('/clubes')}
        >
          Gestión de Clubes
        </Button>
      </Box>
    </Box>
  )
}

