'use client'

import { Box, Typography } from '@mui/material'
import ChecklistIcon from '@mui/icons-material/Checklist'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'

export default function AsistenciaPage() {
  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.SENSEI, ROL.ENCARGADO]}>
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <ChecklistIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Asistencia
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestión de sesiones y registro de asistencia de judokas
            </Typography>
          </Box>
        </Box>
        {/* Contenido implementado en Epic 3 */}
      </Box>
    </ProtectedRoute>
  )
}
