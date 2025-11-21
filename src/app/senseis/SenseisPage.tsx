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
import { useRouter } from 'next/navigation'

export default function SenseisPage() {
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateSuccess = () => {
    setOpenDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (sensei: Sensei) => {
    router.push(`/senseis/${sensei.id}/editar`)
  }

  const handleDelete = async (sensei: Sensei) => {
    if (confirm(`¿Estás seguro de eliminar al sensei "${sensei.nombres} ${sensei.apellidos}"?`)) {
      // TODO: Implementar eliminación
      console.log('Eliminar sensei:', sensei.id)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['asociacion', 'sensei']}>
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

