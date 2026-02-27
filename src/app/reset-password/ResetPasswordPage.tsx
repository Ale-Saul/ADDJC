'use client'

import { Suspense } from 'react'
import ResetPasswordContent from './ResetPasswordContent'
import { Box, CircularProgress, Container, Paper, Typography } from '@mui/material'

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
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
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Cargando...
              </Typography>
            </Paper>
          </Container>
        </Box>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
