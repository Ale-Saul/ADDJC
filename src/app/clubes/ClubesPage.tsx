'use client'

import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ClubList from '@/components/clubes/ClubList'
import ClubForm from '@/components/clubes/ClubForm'
import { Club } from '@/models/club'
import { useRouter } from 'next/navigation'

export default function ClubesPage() {
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateSuccess = () => {
    setOpenDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (club: Club) => {
    router.push(`/clubes/${club.id}/editar`)
  }

  const handleView = (club: Club) => {
    router.push(`/clubes/${club.id}`)
  }

  const handleDelete = async (club: Club) => {
    if (confirm(`¿Estás seguro de eliminar el club "${club.nombre_club}"?`)) {
      // TODO: Implementar eliminación
      console.log('Eliminar club:', club.id)
    }
  }

  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Clubes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nuevo Club
        </Button>
      </Box>

      <ClubList
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Club</DialogTitle>
        <DialogContent>
          <ClubForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

