'use client'

import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import MiembroAsociacionList from '@/components/asociacion/MiembroAsociacionList'
import MiembroAsociacionForm from '@/components/asociacion/MiembroAsociacionForm'
import { MiembroAsociacion } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'
import { useRouter } from 'next/navigation'

export default function AsociacionPage() {
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateSuccess = () => {
    setOpenDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (miembro: MiembroAsociacion) => {
    router.push(`/asociacion/${miembro.id}/editar`)
  }

  const handleDelete = async (miembro: MiembroAsociacion) => {
    if (confirm(`¿Estás seguro de eliminar al miembro "${miembro.nombres} ${miembro.apellidos}"?`)) {
      try {
        const response = await asociacionController.deleteMiembro(miembro.id)
        if (response.success) {
          setRefreshTrigger(prev => prev + 1)
          alert('Miembro eliminado exitosamente')
        } else {
          alert(`Error al eliminar miembro: ${response.error}`)
        }
      } catch (error) {
        console.error('Error al eliminar miembro:', error)
        alert('Error inesperado al eliminar miembro')
      }
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'asociacion']}>
      <Layout>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Miembros de la Asociación
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Nuevo Miembro
          </Button>
        </Box>

        <MiembroAsociacionList
          onEdit={handleEdit}
          onDelete={handleDelete}
          refreshTrigger={refreshTrigger}
        />

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Registrar Nuevo Miembro</DialogTitle>
          <DialogContent>
            {openDialog && (
              <MiembroAsociacionForm
                onSuccess={handleCreateSuccess}
                onCancel={() => setOpenDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}

