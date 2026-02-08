'use client'

import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ArbitroList from '@/components/arbitros/ArbitroList'
import ArbitroForm from '@/components/arbitros/ArbitroForm'
import SearchBar from '@/components/common/SearchBar'
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
import { useRouter } from 'next/navigation'

export default function ArbitrosPage() {
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateSuccess = () => {
    setOpenDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (arbitro: Arbitro) => {
    router.push(`/arbitros/${arbitro.id}/editar`)
  }

  const handleDelete = async (arbitro: Arbitro) => {
    if (confirm(`¿Estás seguro de eliminar al árbitro "${arbitro.nombres} ${arbitro.apellidos}"?`)) {
      try {
        const response = await arbitroController.deleteArbitro(arbitro.id)
        if (response.success) {
          setRefreshTrigger(prev => prev + 1)
          alert('Árbitro eliminado exitosamente')
        } else {
          alert(`Error al eliminar árbitro: ${response.error}`)
        }
      } catch (error) {
        console.error('Error al eliminar árbitro:', error)
        alert('Error inesperado al eliminar árbitro')
      }
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'asociacion', 'arbitro']}>
      <Layout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Árbitros
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nuevo Árbitro
        </Button>
      </Box>

      <SearchBar
        placeholder="Buscar por nombre, apellido o nivel de arbitraje..."
        onSearch={setSearchTerm}
      />

      <ArbitroList
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
        searchTerm={searchTerm}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Nuevo Árbitro</DialogTitle>
        <DialogContent>
          {openDialog && (
            <ArbitroForm
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

