'use client'

import { Card, CardContent, Typography, Chip, Box, Stack } from '@mui/material'
import { Sensei } from '@/models/sensei'

interface SenseiCardProps {
  sensei: Sensei
  onClick?: () => void
}

export default function SenseiCard({ sensei, onClick }: SenseiCardProps) {
  const hasCategorias = Array.isArray(sensei.categorias) && sensei.categorias.length > 0

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
        

        {hasCategorias ? (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Categorías a cargo:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {sensei.categorias!.map((cat) => (
                <Chip key={cat} label={cat} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.72rem' }} />
              ))}
            </Stack>
          </Box>
        ) : sensei.especialidad ? (
          <Typography variant="body2" color="text.secondary">
            📚 {sensei.especialidad}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )
}
