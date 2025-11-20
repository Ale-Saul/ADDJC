'use client'

import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { Club } from '@/models/club'

interface ClubCardProps {
  club: Club
  onClick?: () => void
}

export default function ClubCard({ club, onClick }: ClubCardProps) {
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
            {club.nombre_club}
          </Typography>
          <Chip 
            label={club.activo ? 'Activo' : 'Inactivo'} 
            color={club.activo ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        {club.municipio && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📍 {club.municipio}
          </Typography>
        )}
        
        {club.telefono_contacto && (
          <Typography variant="body2" color="text.secondary">
            📞 {club.telefono_contacto}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

