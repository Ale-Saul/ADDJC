'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Divider,
  Button,
  Skeleton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AnnouncementIcon from '@mui/icons-material/Announcement'
import { useAuth } from '@/contexts/AuthContext'
import { comunicacionController } from '@/controllers/comunicacionController'
import { COMUNICACION_QUERY_KEYS } from '@/constants/comunicacion'
import {
  useNoticiasByClub,
  useCreateNoticia,
  useDeleteNoticia,
  useUpdateNoticia,
} from '@/hooks/useNoticias'
import NuevaNoticiaForm from '@/components/comunicacion/NuevaNoticiaForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { CATEGORIA_LABELS, CATEGORIA_COLOR, labelAudienciaEnNoticia } from '@/constants/comunicacion'
import type { NoticiaCreate, Noticia } from '@/models/comunicacion'
import { formatters } from '@/utils/formatters'
import { ROL } from '@/constants/roles'
import Pagination from '@/components/common/Pagination'

export default function AdminComunicacionPage() {
  const { user } = useAuth()
  const isAsociacion = user?.rol === ROL.ASOCIACION
  const isEncargado = user?.rol === ROL.ENCARGADO
  const clubId = user?.club_id ?? ''
  const [openForm, setOpenForm] = useState(false)
  const [noticiaEdit, setNoticiaEdit] = useState<Noticia | null>(null)
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const queryClient = useQueryClient()
  
  // Si es Asociación o Encargado, permitimos ver noticias globales (donde club_id es null)
  // Pero el Encargado solo debería ver las que ÉL creó si son globales.
  const { data: noticiasClub = [], isLoading: loadingClub } = useNoticiasByClub(clubId, { solo_activas: false })
  const { data: noticiasGlobales = [], isLoading: loadingGlobal } = useNoticiasByClub('global', { solo_activas: false })
  
  const isLoading = loadingClub || loadingGlobal

  // Unir y filtrar: Solo puede editar quien creó la noticia.
  const noticiasVisibles = [...noticiasClub, ...noticiasGlobales].filter(n => n.autor_id === user?.id)
    
  // Eliminar duplicados por ID (por si acaso)
  const noticiasUnicas = Array.from(new Map(noticiasVisibles.map(n => [n.id, n])).values())
  const totalPages = Math.ceil(noticiasUnicas.length / itemsPerPage)
  const currentPage = Math.min(page, totalPages || 1)
  const noticiasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return noticiasUnicas.slice(start, start + itemsPerPage)
  }, [noticiasUnicas, currentPage, itemsPerPage])
    
  const crearMutation = useCreateNoticia(isAsociacion ? undefined : clubId)
  const eliminarMutation = useDeleteNoticia(isAsociacion ? undefined : clubId)
  
  // Hook de actualización
  const updateMutation = useUpdateNoticia(noticiaEdit?.id ?? '', isAsociacion ? undefined : clubId)

  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      comunicacionController.updateNoticia(id, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMUNICACION_QUERY_KEYS.noticias() })
    },
  })

  const handleCrearOEditar = async (payload: NoticiaCreate) => {
    let res
    if (noticiaEdit) {
      res = await updateMutation.mutateAsync(payload)
    } else {
      res = await crearMutation.mutateAsync(payload)
    }

    if (res.success) {
      setOpenForm(false)
      setNoticiaEdit(null)
      setSnackbar({
        msg: noticiaEdit ? 'Noticia actualizada' : 'Noticia publicada',
        severity: 'success'
      })
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  const handleEditClick = (noticia: Noticia) => {
    setNoticiaEdit(noticia)
    setOpenForm(true)
  }

  const handleCloseForm = () => {
    setOpenForm(false)
    setNoticiaEdit(null)
  }

  const handleToggleActivo = async (noticia: Noticia) => {
    const res = await toggleActivoMutation.mutateAsync({ id: noticia.id, activo: !noticia.activo })
    if (res.success) {
      setSnackbar({
        msg: noticia.activo ? 'Noticia ocultada' : 'Noticia activada',
        severity: 'success',
      })
    }
  }

  const handleEliminar = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    const res = await eliminarMutation.mutateAsync(id)
    setConfirmDelete(null)
    if (res.success) {
      setSnackbar({ msg: 'Noticia eliminada permanentemente', severity: 'success' })
    } else {
      setSnackbar({ msg: res.error ?? 'Error al eliminar', severity: 'error' })
    }
  }

  return (
    <Box>
      <PageHeader
        title="Gestión de Noticias"
        actionLabel="Nueva noticia"
        actionIcon={<AddIcon />}
        onAction={() => setOpenForm(true)}
      />

      {/* Lista de noticias */}
      {isLoading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={88} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : noticiasUnicas.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ py: 8, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}
        >
          <AnnouncementIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="body1" color="text.secondary">
            No has publicado ninguna noticia aún
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={() => setOpenForm(true)}
          >
            Crear primera noticia
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            {noticiasPaginadas.map((noticia, idx) => (
              <Box key={noticia.id}>
                {idx > 0 && <Divider />}
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    opacity: noticia.activo ? 1 : 0.55,
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {/* Contenido */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 0.5 }}>
                      <Chip
                        label={CATEGORIA_LABELS[noticia.categoria]}
                        size="small"
                        color={CATEGORIA_COLOR[noticia.categoria]}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      {!noticia.activo && (
                        <Chip label="Oculta" size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      )}
                      {noticia.es_destacada && (
                        <Chip label="Destacada" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      )}
                      {noticia.audiencia.map(aud => (
                        <Chip
                          key={aud}
                          label={labelAudienciaEnNoticia(aud, noticia.club_id)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      ))}
                    </Stack>
                    <Typography variant="body1" fontWeight={600} noWrap>
                      {noticia.titulo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatters.formatDate(noticia.fecha_inicio)}
                      {noticia.fecha_fin && ` – ${formatters.formatDate(noticia.fecha_fin)}`}
                      {noticia.nombre_autor && ` · ${noticia.nombre_autor}`}
                    </Typography>
                  </Box>

                  {/* Acciones */}
                  <Stack direction="row" spacing={0.5} flexShrink={0}>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(noticia)}
                        aria-label="Editar noticia"
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={noticia.activo ? 'Ocultar' : 'Mostrar'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActivo(noticia)}
                        aria-label={noticia.activo ? 'Ocultar noticia' : 'Mostrar noticia'}
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        {noticia.activo
                          ? <VisibilityOffIcon fontSize="small" />
                          : <VisibilityIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={confirmDelete === noticia.id ? 'Confirmar eliminación permanente' : 'Eliminar permanentemente'}>
                      <IconButton
                        size="small"
                        color={confirmDelete === noticia.id ? 'error' : 'default'}
                        onClick={() => handleEliminar(noticia.id)}
                        onBlur={() => setConfirmDelete(null)}
                        aria-label="Eliminar noticia"
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Paper>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={noticiasUnicas.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 20, 50]}
          />
        </Stack>
      )}

      {/* Dialog: Nueva/Editar noticia */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{noticiaEdit ? 'Editar noticia' : 'Nueva noticia'}</DialogTitle>
        <Divider />
        <DialogContent>
          <NuevaNoticiaForm
            key={noticiaEdit?.id ?? 'nueva'}
            autorId={user?.id ?? ''}
            clubId={clubId || undefined}
            rolUsuario={user?.rol}
            noticia={noticiaEdit ?? undefined}
            onSuccess={handleCrearOEditar}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.severity}
          variant="filled"
          onClose={() => setSnackbar(null)}
        >
          {snackbar?.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
