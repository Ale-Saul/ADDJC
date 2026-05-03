'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Snackbar, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import CertificacionList from '@/components/certificaciones/CertificacionList'
import CertificacionForm from '@/components/certificaciones/CertificacionForm'
import { Arbitro } from '@/models/arbitro'
import { Certificacion } from '@/models/certificacion'
import { arbitroController } from '@/controllers/arbitroController'
import { certificacionController } from '@/controllers/certificacionController'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

interface ArbitroCertificacionesPageProps {
  params: Promise<{ id: string }>
}

export default function ArbitroCertificacionesPage({ params }: ArbitroCertificacionesPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = use(params)
  const [arbitro, setArbitro] = useState<Arbitro | null>(null)
  const [loadingArbitro, setLoadingArbitro] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [certEditando, setCertEditando] = useState<Certificacion | null>(null)
  const [certToDelete, setCertToDelete] = useState<Certificacion | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isReadOnly = user?.rol === ROL.SENSEI || user?.rol === ROL.ENCARGADO || user?.rol === ROL.ARBITRO

  const loadArbitro = useCallback(async () => {
    setLoadingArbitro(true)
    setLoadError(null)
    const response = await arbitroController.getArbitroById(id)
    if (response.success && response.data) {
      setArbitro(response.data)
    } else {
      setLoadError(response.error || 'Error al cargar el árbitro')
    }
    setLoadingArbitro(false)
  }, [id])

  useEffect(() => {
    if (id) loadArbitro()
  }, [id, loadArbitro])

  const handleCreateSuccess = () => {
    setOpenCreateDialog(false)
    setSuccessMessage('Certificación agregada exitosamente')
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEditSuccess = () => {
    setCertEditando(null)
    setSuccessMessage('Certificación actualizada exitosamente')
    setRefreshTrigger(prev => prev + 1)
  }

  const handleConfirmDelete = async () => {
    if (!certToDelete) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const response = await certificacionController.deleteCertificacion(certToDelete.id)
      if (response.success) {
        setCertToDelete(null)
        setSuccessMessage('Certificación eliminada exitosamente')
        setRefreshTrigger(prev => prev + 1)
      } else {
        setDeleteError(response.error || 'Error al eliminar certificación')
        setCertToDelete(null)
      }
    } catch {
      setDeleteError('Error inesperado al eliminar certificación')
      setCertToDelete(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION, ROL.ARBITRO, ROL.SENSEI, ROL.ENCARGADO]}>
        {loadingArbitro ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={() => router.push('/arbitros')}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                  Certificaciones de {arbitro?.nombres} {arbitro?.apellidos}
                </Typography>
              </Box>
              {!isReadOnly && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                >
                  Agregar Certificación
                </Button>
              )}
            </Box>

            {arbitro && (
              <CertificacionList
                usuarioId={arbitro.usuario_id}
                tipoAfiliado="arbitro"
                onEdit={isReadOnly ? undefined : (cert) => setCertEditando(cert)}
                onDelete={isReadOnly ? undefined : (cert) => setCertToDelete(cert)}
                refreshTrigger={refreshTrigger}
                readOnly={isReadOnly}
              />
            )}

            {/* Diálogo de Creación */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Agregar Certificación</DialogTitle>
              <DialogContent>
                {arbitro && (
                  <CertificacionForm
                    usuarioId={arbitro.usuario_id}
                    tipoAfiliado="arbitro"
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setOpenCreateDialog(false)}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Diálogo de Edición */}
            <Dialog open={!!certEditando} onClose={() => setCertEditando(null)} maxWidth="sm" fullWidth>
              <DialogTitle>Editar Certificación</DialogTitle>
              <DialogContent>
                {certEditando && arbitro && (
                  <CertificacionForm
                    certificacion={certEditando}
                    usuarioId={arbitro.usuario_id}
                    tipoAfiliado="arbitro"
                    onSuccess={handleEditSuccess}
                    onCancel={() => setCertEditando(null)}
                  />
                )}
              </DialogContent>
            </Dialog>

            <ConfirmDialog
              open={!!certToDelete}
              title="Eliminar Certificación"
              message={certToDelete ? `¿Estás seguro de eliminar la certificación "${certToDelete.nombre_certificacion}"?` : ''}
              onConfirm={handleConfirmDelete}
              onClose={() => setCertToDelete(null)}
              confirmText="Eliminar"
              loading={deleteLoading}
            />

            <Snackbar
              open={!!deleteError}
              autoHideDuration={4000}
              onClose={() => setDeleteError(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert severity="error" onClose={() => setDeleteError(null)}>{deleteError}</Alert>
            </Snackbar>

            <Snackbar
              open={!!successMessage}
              autoHideDuration={3000}
              onClose={() => setSuccessMessage(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
            </Snackbar>
          </>
        )}
    </ProtectedRoute>
  )
}
