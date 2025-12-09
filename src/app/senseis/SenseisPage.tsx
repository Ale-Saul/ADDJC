'use client'

import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import SenseiList from '@/components/senseis/SenseiList'
import SenseiForm from '@/components/senseis/SenseiForm'
import SearchBar from '@/components/common/SearchBar'
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function SenseisPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Si es encargado o sensei, filtrar por su club
  const clubId = (user?.rol === 'encargado' || user?.rol === 'sensei') ? user.club_id : undefined

  const handleCreateSuccess = () => {
    setOpenDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (sensei: Sensei) => {
    router.push(`/senseis/${sensei.id}/editar`)
  }

  const handleDelete = async (sensei: Sensei) => {
    if (confirm(`¿Estás seguro de eliminar al sensei "${sensei.nombres} ${sensei.apellidos}"?`)) {
      try {
        const response = await senseiController.deleteSensei(sensei.id)
        if (response.success) {
          setRefreshTrigger(prev => prev + 1)
          alert('Sensei eliminado exitosamente')
        } else {
          alert(`Error al eliminar sensei: ${response.error}`)
        }
      } catch (error) {
        console.error('Error al eliminar sensei:', error)
        alert('Error inesperado al eliminar sensei')
      }
    }
  }

  return (
    <ProtectedRoute allowedRoles={['asociacion', 'encargado']}>
      <Layout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Senseis
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nuevo Sensei
        </Button>
      </Box>

      <SearchBar
        placeholder="Buscar por nombre, apellido, grado dan o especialidad..."
        onSearch={setSearchTerm}
      />

      <SenseiList
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
        searchTerm={searchTerm}
        clubId={clubId}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Nuevo Sensei</DialogTitle>
        <DialogContent>
          <SenseiForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
    </ProtectedRoute>
  )
}

