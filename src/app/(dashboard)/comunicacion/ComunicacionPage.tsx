'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Skeleton,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AnnouncementIcon from '@mui/icons-material/Announcement'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNoticiasDestacadas, useNoticiasParaUsuario } from '@/hooks/useNoticias'
import NoticiaCard from '@/components/comunicacion/NoticiaCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ROL } from '@/constants/roles'
import { CATEGORIA_LABELS, CATEGORIA_COLOR } from '@/constants/comunicacion'
import type { Noticia, ComunicacionAudiencia, ComunicacionCategoria } from '@/models/comunicacion'
import { formatters } from '@/utils/formatters'

const ROL_AUDIENCIA: Record<string, ComunicacionAudiencia> = {
  [ROL.ADMIN]: 'todos',
  [ROL.ASOCIACION]: 'todos',
  [ROL.ENCARGADO]: 'encargados',
  [ROL.SENSEI]: 'senseis',
  [ROL.JUDOKA]: 'judokas',
  [ROL.ARBITRO]: 'arbitros',
}

export default function ComunicacionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [noticiaDetalle, setNoticiaDetalle] = useState<Noticia | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<ComunicacionCategoria | 'todas'>('todas')

  const audiencia = ROL_AUDIENCIA[user?.rol ?? ''] ?? 'todos'
  const clubId = user?.club_id ?? undefined
  const puedePublicar = [ROL.ADMIN, ROL.ASOCIACION, ROL.ENCARGADO].includes(user?.rol as any)

  const { data: destacadas = [], isLoading: loadingDestacadas } = useNoticiasDestacadas(clubId, audiencia, user?.rol)
  const { data: noticias = [], isLoading: loadingNoticias } = useNoticiasParaUsuario(audiencia, clubId, user?.rol)

  const noticiasFiltradas = filtroCategoria === 'todas'
    ? noticias
    : noticias.filter(n => n.categoria === filtroCategoria)

  const categorias: ComunicacionCategoria[] = ['evento', 'institucional', 'logro']

  return (
    <Box>
      <PageHeader title="Comunicación" />

      {/* Noticias destacadas */}
      {(loadingDestacadas || destacadas.length > 0) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Destacadas
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}>
            {loadingDestacadas
              ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              ))
              : destacadas.map(n => (
                <NoticiaCard key={n.id} noticia={n} onClick={setNoticiaDetalle} />
              ))
            }
          </Box>
        </Box>
      )}

      {/* Filtro por categoría */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Noticias
        </Typography>
        <ToggleButtonGroup
          value={filtroCategoria}
          exclusive
          onChange={(_, v) => v && setFiltroCategoria(v)}
          size="small"
          aria-label="Filtrar por categoría"
        >
          <ToggleButton value="todas" sx={{ fontSize: '0.75rem', py: 0.5 }}>
            Todas
          </ToggleButton>
          {categorias.map(cat => (
            <ToggleButton key={cat} value={cat} sx={{ fontSize: '0.75rem', py: 0.5 }}>
              {CATEGORIA_LABELS[cat]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {/* Grid de noticias */}
      {loadingNoticias ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : noticiasFiltradas.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ py: 8, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}
        >
          <AnnouncementIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="body1" color="text.secondary">
            {filtroCategoria !== 'todas'
              ? `No hay noticias de tipo "${CATEGORIA_LABELS[filtroCategoria]}" disponibles`
              : 'No hay noticias disponibles por ahora'}
          </Typography>
          {puedePublicar && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              onClick={() => router.push('/comunicacion/admin')}
            >
              Publicar la primera noticia
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}>
          {noticiasFiltradas.map(n => (
            <NoticiaCard key={n.id} noticia={n} onClick={setNoticiaDetalle} />
          ))}
        </Box>
      )}

      {/* Modal de detalle */}
      <Dialog
        open={!!noticiaDetalle}
        onClose={() => setNoticiaDetalle(null)}
        maxWidth="sm"
        fullWidth
      >
        {noticiaDetalle && (
          <>
            {noticiaDetalle.imagen_url && (
              <Box
                component="img"
                src={noticiaDetalle.imagen_url}
                alt={noticiaDetalle.titulo}
                sx={{ width: '100%', maxHeight: 220, objectFit: 'cover' }}
              />
            )}
            <DialogTitle sx={{ pb: 1 }}>
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={0.75}>
                  <Chip
                    label={CATEGORIA_LABELS[noticiaDetalle.categoria]}
                    size="small"
                    color={CATEGORIA_COLOR[noticiaDetalle.categoria]}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </Stack>
                <Typography variant="h6" fontWeight={600} lineHeight={1.3}>
                  {noticiaDetalle.titulo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {noticiaDetalle.nombre_autor && `Por ${noticiaDetalle.nombre_autor} · `}
                  {formatters.formatDate(noticiaDetalle.fecha_inicio)}
                </Typography>
              </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {noticiaDetalle.contenido}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setNoticiaDetalle(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
