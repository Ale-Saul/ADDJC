'use client'

import { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ArbitroList from '@/components/arbitros/ArbitroList'
import ArbitroForm from '@/components/arbitros/ArbitroForm'
import { Arbitro } from '@/models/arbitro'
import { useRouter } from 'next/navigation'

export default function ArbitrosPage() {
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

      <ArbitroList
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
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
  )
}

