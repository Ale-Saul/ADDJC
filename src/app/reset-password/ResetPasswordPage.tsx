import { Suspense } from 'react'
import ResetPasswordContent from './ResetPasswordContent'
import { Box, CircularProgress } from '@mui/material'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
