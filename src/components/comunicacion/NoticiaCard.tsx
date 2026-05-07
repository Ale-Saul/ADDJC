'use client'

import {
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PersonIcon from '@mui/icons-material/Person'
import type { Noticia } from '@/models/comunicacion'
import { CATEGORIA_LABELS, CATEGORIA_COLOR } from '@/constants/comunicacion'
import { formatters } from '@/utils/formatters'

interface Props {
  noticia: Noticia
  onClick?: (noticia: Noticia) => void
  compact?: boolean
}

export default function NoticiaCard({ noticia, onClick, compact = false }: Props) {
  const handleClick = () => onClick?.(noticia)

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        ...(onClick && {
          cursor: 'pointer',
          '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
        }),
      }}
    >
      <CardActionArea
        onClick={handleClick}
        disabled={!onClick}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {/* Imagen */}
        {noticia.imagen_url && !compact && (
          <CardMedia
            component="img"
            height={160}
            image={noticia.imagen_url}
            alt={noticia.titulo}
            sx={{ objectFit: 'cover' }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, pb: '12px !important' }}>
          {/* Chips: categoría + destacada */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip
              label={CATEGORIA_LABELS[noticia.categoria]}
              size="small"
              color={CATEGORIA_COLOR[noticia.categoria]}
              variant="filled"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
            {noticia.es_destacada && (
              <Chip
                icon={<StarIcon sx={{ fontSize: '0.75rem !important' }} />}
                label="Destacada"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Stack>

          {/* Título */}
          <Typography
            variant={compact ? 'body1' : 'h6'}
            fontWeight={600}
            lineHeight={1.3}
            sx={{
              mb: 0.75,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {noticia.titulo}
          </Typography>

          {/* Contenido (preview) */}
          {!compact && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.6,
              }}
            >
              {noticia.contenido}
            </Typography>
          )}

          {/* Meta: autor y fecha */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 'auto' }}>
            {noticia.nombre_autor && (
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <PersonIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {noticia.nombre_autor}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {formatters.formatDate(noticia.fecha_inicio)}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
