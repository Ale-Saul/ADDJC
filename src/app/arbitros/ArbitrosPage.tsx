'use client'

import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Snackbar, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ArbitroList from '@/components/arbitros/ArbitroList'
import ArbitroForm from '@/components/arbitros/ArbitroForm'
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
import { useDialog } from '@/hooks/useDialog'
import { ROL } from '@/constants/roles'

export default function ArbitrosPage() {
  const router = useRouter()
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

  const handleEdit = (arbitro: Arbitro) => {
    editDialog.open(arbitro)
  }

  const handleCertificacion = (arbitro: Arbitro) => {
    router.push(`/arbitros/${arbitro.id}/certificaciones`)
  }

  const handleDelete = (arbitro: Arbitro) => {
    deleteDialog.open(arbitro)
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.data) return
    setDeleteLoading(true)
    try {
      const response = await arbitroController.deleteArbitro(deleteDialog.data.id)
      if (response.success) {
        deleteDialog.close()
        setRefreshTrigger(prev => prev + 1)
      } else {
        setDeleteError(response.error || 'Error al eliminar árbitro')
        deleteDialog.close()
      }
    } catch {
      setDeleteError('Error inesperado al eliminar árbitro')
      deleteDialog.close()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION, ROL.ARBITRO]}>
      <Layout>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Gestión de Árbitros
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => createDialog.open()}
          >
            Nuevo Árbitro
          </Button>
        </Box>

        <ArbitroList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCertificacion={handleCertificacion}
          refreshTrigger={refreshTrigger}
        />

        {/* Diálogo de Creación */}
        <Dialog open={createDialog.isOpen} onClose={createDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Registrar Nuevo Árbitro</DialogTitle>
          <DialogContent>
            <ArbitroForm
              onSuccess={handleCreateSuccess}
              onCancel={createDialog.close}
            />
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición */}
        <Dialog open={editDialog.isOpen} onClose={editDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Editar Árbitro</DialogTitle>
          <DialogContent>
            {editDialog.data && (
              <ArbitroForm
                arbitro={editDialog.data}
                onSuccess={handleEditSuccess}
                onCancel={editDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialog.isOpen}
          title="Eliminar Árbitro"
          message={deleteDialog.data ? `¿Estás seguro de eliminar al árbitro "${deleteDialog.data.nombres} ${deleteDialog.data.apellidos}"?` : ''}
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
