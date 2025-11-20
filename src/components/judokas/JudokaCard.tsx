'use client'

import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { Judoka } from '@/models/judoka'

interface JudokaCardProps {
  judoka: Judoka
  onClick?: () => void
}

export default function JudokaCard({ judoka, onClick }: JudokaCardProps) {
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
            {judoka.nombres} {judoka.apellidos}
          </Typography>
          <Chip 
            label={judoka.activo ? 'Activo' : 'Inactivo'} 
            color={judoka.activo ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        {judoka.cinturon_actual && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            🥋 {judoka.cinturon_actual}
          </Typography>
        )}
        
        {judoka.categoria && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📊 {judoka.categoria}
          </Typography>
        )}
        
        {judoka.peso_competitivo && (
          <Typography variant="body2" color="text.secondary">
            ⚖️ {judoka.peso_competitivo} kg
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

