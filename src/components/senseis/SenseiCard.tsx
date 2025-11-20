'use client'

import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { Sensei } from '@/models/sensei'

interface SenseiCardProps {
  sensei: Sensei
  onClick?: () => void
}

export default function SenseiCard({ sensei, onClick }: SenseiCardProps) {
  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {},
        height: '100%'
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" fontWeight="bold">
            {sensei.nombres} {sensei.apellidos}
          </Typography>
          <Chip 
            label={sensei.activo ? 'Activo' : 'Inactivo'} 
            color={sensei.activo ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        {sensei.grado_dan && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            🥋 {sensei.grado_dan}
          </Typography>
        )}
        
        {sensei.especialidad && (
          <Typography variant="body2" color="text.secondary">
            📚 {sensei.especialidad}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

