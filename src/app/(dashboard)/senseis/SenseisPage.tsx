'use client'

import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Snackbar, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import AddIcon from '@mui/icons-material/Add'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import SenseiList from '@/components/senseis/SenseiList'
import SenseiForm from '@/components/senseis/SenseiForm'
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { useAuth } from '@/contexts/AuthContext'
import { useDialog } from '@/hooks/useDialog'
import { ROL } from '@/constants/roles'

export default function SenseisPage() {
  const { user } = useAuth()
  const router = useRouter()
  const createDialog = useDialog()
  const editDialog = useDialog()
  const deleteDialog = useDialog()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Si es encargado, sensei o judoka, filtrar por su club
  const clubId = (user?.rol === ROL.ENCARGADO || user?.rol === ROL.SENSEI || user?.rol === ROL.JUDOKA) ? user.club_id : undefined
  const isReadOnly = user?.rol === ROL.SENSEI || user?.rol === ROL.JUDOKA

  const handleCreateSuccess = () => {
    createDialog.close()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEditSuccess = () => {
    editDialog.close()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (sensei: Sensei) => {
    editDialog.open(sensei)
  }

  const handleCertificacion = (sensei: Sensei) => {
    router.push(`/senseis/${sensei.id}/certificaciones`)
  }

  const handleDelete = (sensei: Sensei) => {
    deleteDialog.open(sensei)
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.data) return
    setDeleteLoading(true)
    try {
      const response = await senseiController.deleteSensei(deleteDialog.data.id)
      if (response.success) {
        deleteDialog.close()
        setRefreshTrigger(prev => prev + 1)
      } else {
        setDeleteError(response.error || 'Error al eliminar sensei')
        deleteDialog.close()
      }
    } catch {
      setDeleteError('Error inesperado al eliminar sensei')
      deleteDialog.close()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION, ROL.ENCARGADO, ROL.SENSEI, ROL.JUDOKA]}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Gestión de Senseis
          </Typography>
          {!isReadOnly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => createDialog.open()}
          >
            Nuevo Sensei
          </Button>
          )}
        </Box>

        <SenseiList
          onEdit={isReadOnly ? undefined : handleEdit}
          onDelete={isReadOnly ? undefined : handleDelete}
          onCertificacion={handleCertificacion}
          refreshTrigger={refreshTrigger}
          clubId={clubId || undefined}
          showUnassigned={user?.rol === ROL.ENCARGADO || user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION}
          readOnly={isReadOnly}
        />

        {/* Diálogo de Creación */}
        <Dialog open={createDialog.isOpen} onClose={createDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Registrar Nuevo Sensei</DialogTitle>
          <DialogContent>
            <SenseiForm
              onSuccess={handleCreateSuccess}
              onCancel={createDialog.close}
            />
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición */}
        <Dialog open={editDialog.isOpen} onClose={editDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Editar Sensei</DialogTitle>
          <DialogContent>
            {editDialog.data && (
              <SenseiForm
                sensei={editDialog.data}
                onSuccess={handleEditSuccess}
                onCancel={editDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialog.isOpen}
          title="Eliminar Sensei"
          message={deleteDialog.data ? `¿Estás seguro de eliminar al sensei "${deleteDialog.data.nombres} ${deleteDialog.data.apellidos}"?` : ''}
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
    </ProtectedRoute>
  )
}
