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
      // TODO: Implementar eliminación
      console.log('Eliminar árbitro:', arbitro.id)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['asociacion', 'arbitro']}>
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
          <ArbitroForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
    </ProtectedRoute>
  )
}

