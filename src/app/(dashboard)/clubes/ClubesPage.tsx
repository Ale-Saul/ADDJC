'use client'

import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Snackbar, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ClubList from '@/components/clubes/ClubList'
import ClubForm from '@/components/clubes/ClubForm'
import ClubDocumentoList from '@/components/clubes/ClubDocumentoList'
import ClubDocumentoForm from '@/components/clubes/ClubDocumentoForm'
import { Club, ClubDocumento } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import { useDialog } from '@/hooks/useDialog'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

export default function ClubesPage() {
  const { user } = useAuth()
  const isReadOnly = user?.rol === ROL.JUDOKA || user?.rol === ROL.SENSEI || user?.rol === ROL.ENCARGADO || user?.rol === ROL.ARBITRO
  const createDialog = useDialog()
  const editDialog = useDialog()
  const deleteDialog = useDialog()
  const documentosDialog = useDialog<Club>()
  const nuevoDocumentoDialog = useDialog<Club>()
  const deleteDocumentoDialog = useDialog<ClubDocumento>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleCreateSuccess = () => {
    createDialog.close()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEditSuccess = () => {
    editDialog.close()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (club: Club) => {
    editDialog.open(club)
  }

  const handleView = (club: Club) => {
    editDialog.open(club)
  }

  const handleViewDocumentos = (club: Club) => {
    documentosDialog.open(club)
  }

  const handleAddDocumento = (club: Club) => {
    nuevoDocumentoDialog.open(club)
  }

  const handleDeleteDocumento = (documento: ClubDocumento) => {
    deleteDocumentoDialog.open(documento)
  }

  const handleConfirmDeleteDocumento = async () => {
    if (!deleteDocumentoDialog.data) return
    try {
      const response = await clubController.deleteDocument(deleteDocumentoDialog.data.id)
      if (response.success) {
        deleteDocumentoDialog.close()
        setRefreshTrigger(prev => prev + 1)
      } else {
        setDeleteError(response.error || 'Error al eliminar documento')
      }
    } catch {
      setDeleteError('Error inesperado al eliminar documento')
    }
  }

  const handleDelete = (club: Club) => {
    deleteDialog.open(club)
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.data) return
    setDeleteLoading(true)
    try {
      const response = await clubController.deleteClub(deleteDialog.data.id)
      if (response.success) {
        deleteDialog.close()
        setRefreshTrigger(prev => prev + 1)
      } else {
        setDeleteError(response.error || 'Error al eliminar club')
        deleteDialog.close()
      }
    } catch {
      setDeleteError('Error inesperado al eliminar club')
      deleteDialog.close()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION, ROL.JUDOKA, ROL.SENSEI, ROL.ENCARGADO, ROL.ARBITRO]}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Gestión de Clubes
          </Typography>
          {!isReadOnly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => createDialog.open()}
          >
            Nuevo Club
          </Button>
          )}
        </Box>

        <ClubList
          onEdit={isReadOnly ? (user?.rol === ROL.ENCARGADO ? handleView : undefined) : handleEdit}
          onDelete={isReadOnly ? undefined : handleDelete}
          onViewDocumentos={handleViewDocumentos}
          refreshTrigger={refreshTrigger}
          readOnly={isReadOnly}
        />

        {/* Diálogo de Creación */}
        <Dialog open={createDialog.isOpen} onClose={createDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Crear Nuevo Club</DialogTitle>
          <DialogContent>
            <ClubForm
              onSuccess={handleCreateSuccess}
              onCancel={createDialog.close}
            />
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición */}
        <Dialog open={editDialog.isOpen} onClose={editDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Editar Club</DialogTitle>
          <DialogContent>
            {editDialog.data && (
              <ClubForm
                club={editDialog.data}
                onSuccess={handleEditSuccess}
                onCancel={editDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialog.isOpen}
          title="Eliminar Club"
          message={deleteDialog.data ? `¿Estás seguro de eliminar el club "${deleteDialog.data.nombre_club}"?` : ''}
          onConfirm={handleConfirmDelete}
          onClose={deleteDialog.close}
          confirmText="Eliminar"
          loading={deleteLoading}
        />

        {/* Diálogo de Documentos */}
        <Dialog open={documentosDialog.isOpen} onClose={documentosDialog.close} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="span">Documentos del Club: {documentosDialog.data?.nombre_club}</Typography>
            {!isReadOnly && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => documentosDialog.data && handleAddDocumento(documentosDialog.data)}
              >
                Nuevo Documento
              </Button>
            )}
          </DialogTitle>
          <DialogContent>
            {documentosDialog.data && (
              <Box sx={{ mt: 1 }}>
                <ClubDocumentoList
                  clubId={documentosDialog.data.id}
                  onDelete={isReadOnly ? undefined : handleDeleteDocumento}
                  refreshTrigger={refreshTrigger}
                  readOnly={isReadOnly}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de Nuevo Documento */}
        <Dialog open={nuevoDocumentoDialog.isOpen} onClose={nuevoDocumentoDialog.close} maxWidth="sm" fullWidth>
          <DialogTitle>Agregar Documento al Club</DialogTitle>
          <DialogContent>
            {nuevoDocumentoDialog.data && (
              <ClubDocumentoForm
                clubId={nuevoDocumentoDialog.data.id}
                onSuccess={() => {
                  nuevoDocumentoDialog.close()
                  setRefreshTrigger(prev => prev + 1)
                }}
                onCancel={nuevoDocumentoDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmar Eliminar Documento */}
        <ConfirmDialog
          open={deleteDocumentoDialog.isOpen}
          title="Eliminar Documento"
          message={`¿Estás seguro de eliminar el documento "${deleteDocumentoDialog.data?.nombre_documento}"?`}
          onConfirm={handleConfirmDeleteDocumento}
          onClose={deleteDocumentoDialog.close}
          confirmText="Eliminar"
          confirmColor="error"
        />

        <Snackbar
          open={!!deleteError}
          autoHideDuration={4000}
          onClose={() => setDeleteError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setDeleteError(null)}>{deleteError}</Alert>
        </Snackbar>
    </ProtectedRoute>
  )
}
