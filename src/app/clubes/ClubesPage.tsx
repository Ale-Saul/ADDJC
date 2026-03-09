'use client'

import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Snackbar, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ClubList from '@/components/clubes/ClubList'
import ClubForm from '@/components/clubes/ClubForm'
import { Club } from '@/models/club'
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
      <Layout>
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

        <Snackbar
          open={!!deleteError}
          autoHideDuration={4000}
          onClose={() => setDeleteError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setDeleteError(null)}>{deleteError}</Alert>
        </Snackbar>
      </Layout>
    </ProtectedRoute>
  )
}
