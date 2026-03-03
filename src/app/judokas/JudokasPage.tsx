'use client'

import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import JudokaList from '@/components/judokas/JudokaList'
import JudokaForm from '@/components/judokas/JudokaForm'
import { Judoka } from '@/models/judoka'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useDialog } from '@/hooks/useDialog'
import { judokaController } from '@/controllers/judokaController'

export default function JudokasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const dialog = useDialog()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Determinar filtros según el rol
  const clubId = user?.rol === 'encargado' ? user.club_id : undefined
  const entrenadorId = user?.rol === 'sensei' ? user.sensei_id : undefined

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCreateSuccess = () => {
    handleRefresh()
    dialog.close()
  }

  const handleEdit = (judoka: Judoka) => {
    router.push(`/judokas/${judoka.id}/editar`)
  }

  const handleDelete = async (judoka: Judoka) => {
    if (confirm(`¿Estás seguro de eliminar al judoka "${judoka.nombres} ${judoka.apellidos}"?`)) {
      const response = await judokaController.deleteJudoka(judoka.id)
      if (response.success) {
        handleRefresh()
      } else {
        alert('Error al eliminar judoka: ' + response.error)
      }
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'asociacion', 'sensei', 'encargado', 'judoka']}>
      <Layout>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Gestión de Judokas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => dialog.open()}
            sx={{ height: 48 }}
          >
            Nuevo Judoka
          </Button>
        </Box>

        <JudokaList
          clubId={clubId}
          entrenadorId={entrenadorId}
          refreshTrigger={refreshTrigger}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Dialog open={dialog.isOpen} onClose={dialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Registrar Nuevo Judoka</DialogTitle>
          <DialogContent>
            <JudokaForm
              onSuccess={handleCreateSuccess}
              onCancel={dialog.close}
            />
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}

