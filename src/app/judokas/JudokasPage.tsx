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
import { judokaController } from '@/controllers/judokaController'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function JudokasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [openDialog, setOpenDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Determinar qué filtro usar según el rol
  let clubId: string | undefined
  let entrenadorId: string | undefined

  if (user?.rol === 'encargado') {
    // Encargado: ver todos los judokas del club
    clubId = user.club_id || undefined
  } else if (user?.rol === 'sensei') {
    // Sensei normal: ver solo sus estudiantes
    entrenadorId = user.id
  }
  // Si es 'asociacion', no se filtra (ve todos)

  const handleCreateSuccess = () => {
    setOpenDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (judoka: Judoka) => {
    router.push(`/judokas/${judoka.id}/editar`)
  }

  const handleDelete = async (judoka: Judoka) => {
    if (confirm(`¿Estás seguro de eliminar al judoka "${judoka.nombres} ${judoka.apellidos}"?`)) {
      try {
        const response = await judokaController.deleteJudoka(judoka.id)
        if (response.success) {
          setRefreshTrigger(prev => prev + 1)
          alert('Judoka eliminado exitosamente')
        } else {
          alert(`Error al eliminar judoka: ${response.error}`)
        }
      } catch (error) {
        console.error('Error al eliminar judoka:', error)
        alert('Error inesperado al eliminar judoka')
      }
    }
  }

  return (
    <ProtectedRoute allowedRoles={['asociacion', 'sensei', 'encargado', 'judoka']}>
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
        clubId={clubId}
        entrenadorId={entrenadorId}
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

