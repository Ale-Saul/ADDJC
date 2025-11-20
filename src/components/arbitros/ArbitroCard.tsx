'use client'

import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { Arbitro } from '@/models/arbitro'

interface ArbitroCardProps {
  arbitro: Arbitro
  onClick?: () => void
}

export default function ArbitroCard({ arbitro, onClick }: ArbitroCardProps) {
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
            {arbitro.nombres} {arbitro.apellidos}
          </Typography>
          <Chip 
            label={arbitro.activo ? 'Activo' : 'Inactivo'} 
            color={arbitro.activo ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        {arbitro.nivel_arbitraje && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📋 {arbitro.nivel_arbitraje}
          </Typography>
        )}
        
        {arbitro.fecha_nacimiento && (
          <Typography variant="body2" color="text.secondary">
            🎂 {new Date(arbitro.fecha_nacimiento).toLocaleDateString('es-ES')}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

