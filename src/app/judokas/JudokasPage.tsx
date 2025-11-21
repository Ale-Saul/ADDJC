'use client'

import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import JudokaList from '@/components/judokas/JudokaList'
import JudokaForm from '@/components/judokas/JudokaForm'
import SearchBar from '@/components/common/SearchBar'
import { Judoka } from '@/models/judoka'
import { useRouter } from 'next/navigation'

export default function JudokasPage() {
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateSuccess = () => {
    setOpenDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (judoka: Judoka) => {
    router.push(`/judokas/${judoka.id}/editar`)
  }

  const handleDelete = async (judoka: Judoka) => {
    if (confirm(`¿Estás seguro de eliminar al judoka "${judoka.nombres} ${judoka.apellidos}"?`)) {
      // TODO: Implementar eliminación
      console.log('Eliminar judoka:', judoka.id)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['asociacion', 'sensei', 'judoka']}>
      <Layout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Judokas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nuevo Judoka
        </Button>
      </Box>

      <SearchBar
        placeholder="Buscar por nombre, apellido, categoría o cinturón..."
        onSearch={setSearchTerm}
      />

      <JudokaList
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
        searchTerm={searchTerm}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Nuevo Judoka</DialogTitle>
        <DialogContent>
          <JudokaForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
    </ProtectedRoute>
  )
}

