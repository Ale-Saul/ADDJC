'use client'

import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Snackbar, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import JudokaList from '@/components/judokas/JudokaList'
import JudokaForm from '@/components/judokas/JudokaForm'
import { Judoka } from '@/models/judoka'
import { useAuth } from '@/contexts/AuthContext'
import { useDialog } from '@/hooks/useDialog'
import { judokaController } from '@/controllers/judokaController'
import { ROL } from '@/constants/roles'

export default function JudokasPage() {
  const { user } = useAuth()
  const createDialog = useDialog()
  const editDialog = useDialog()
  const deleteDialog = useDialog()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Determinar filtros según el rol
  const isJudoka = user?.rol === ROL.JUDOKA
  const isSensei = user?.rol === ROL.SENSEI
  const clubId = (user?.rol === ROL.ENCARGADO || isJudoka || isSensei) ? user?.club_id : undefined
  const entrenadorId = undefined
  const senseiId = isSensei ? user?.sensei_id : undefined

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCreateSuccess = () => {
    handleRefresh()
    createDialog.close()
  }

  const handleEditSuccess = () => {
    handleRefresh()
    editDialog.close()
  }

  const handleEdit = (judoka: Judoka) => {
    editDialog.open(judoka)
  }

  const handleDelete = (judoka: Judoka) => {
    deleteDialog.open(judoka)
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.data) return
    setDeleteLoading(true)
    try {
      const response = await judokaController.deleteJudoka(deleteDialog.data.id)
      if (response.success) {
        deleteDialog.close()
        handleRefresh()
      } else {
        setDeleteError(response.error || 'Error al eliminar judoka')
        deleteDialog.close()
      }
    } catch {
      setDeleteError('Error inesperado al eliminar judoka')
      deleteDialog.close()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION, ROL.SENSEI, ROL.ENCARGADO, ROL.JUDOKA]}>
      <Layout>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Gestión de Judokas
          </Typography>
          {!isJudoka && !isSensei && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => createDialog.open()}
              sx={{ height: 48 }}
            >
              Nuevo Judoka
            </Button>
          )}
        </Box>

        <JudokaList
          clubId={clubId}
          entrenadorId={entrenadorId}
          senseiId={senseiId}
          refreshTrigger={refreshTrigger}
          onEdit={isJudoka ? undefined : handleEdit}
          onDelete={isJudoka ? undefined : handleDelete}
          showUnassigned={user?.rol === ROL.ENCARGADO || isSensei || user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION}
          readOnly={isJudoka}
        />

        {/* Diálogo de Creación */}
        <Dialog open={createDialog.isOpen} onClose={createDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Registrar Nuevo Judoka</DialogTitle>
          <DialogContent>
            <JudokaForm
              onSuccess={handleCreateSuccess}
              onCancel={createDialog.close}
            />
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición */}
        <Dialog open={editDialog.isOpen} onClose={editDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Editar Judoka</DialogTitle>
          <DialogContent>
            {editDialog.data && (
              <JudokaForm
                judoka={editDialog.data}
                onSuccess={handleEditSuccess}
                onCancel={editDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialog.isOpen}
          title="Eliminar Judoka"
          message={deleteDialog.data ? `¿Estás seguro de eliminar al judoka "${deleteDialog.data.nombres} ${deleteDialog.data.apellidos}"?` : ''}
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
