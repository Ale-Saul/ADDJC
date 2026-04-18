'use client'

import { Box, Typography } from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'

export default function MiAsistenciaPage() {
  return (
    <ProtectedRoute allowedRoles={[ROL.JUDOKA]}>
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <InsightsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Mi Asistencia
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tu porcentaje de asistencia y resumen por periodo
            </Typography>
          </Box>
        </Box>
        {/* Contenido implementado en Epic 4 */}
      </Box>
    </ProtectedRoute>
  )
}
