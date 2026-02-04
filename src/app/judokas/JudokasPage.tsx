'use client'

import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import JudokaList from '@/components/judokas/JudokaList'
import JudokaForm from '@/components/judokas/JudokaForm'
import SearchBar from '@/components/common/SearchBar'
import { Judoka } from '@/models/judoka'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useJudokas } from '@/hooks/useJudokas'
import { useDialog } from '@/hooks/useDialog'

export default function JudokasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const dialog = useDialog()

  // Determinar filtros según el rol
  const clubId = user?.rol === 'encargado' ? user.club_id : undefined
  const entrenadorId = user?.rol === 'sensei' ? user.id : undefined

  // Hook de judokas con filtros
  const {
    judokas,
    isLoading,
    searchTerm,
    setSearchTerm,
    deleteJudoka,
    refresh,
  } = useJudokas({ clubId, entrenadorId })

  const handleCreateSuccess = () => {
    dialog.close()
    refresh()
  }

  const handleEdit = (judoka: Judoka) => {
    router.push(`/judokas/${judoka.id}/editar`)
  }

  const handleDelete = async (judoka: Judoka) => {
    await deleteJudoka(judoka.id)
    refresh()
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
        >
          Nuevo Judoka
        </Button>
      </Box>

      <SearchBar
        placeholder="Buscar por nombre, apellido, categoría o cinturón..."
        onSearch={setSearchTerm}
      />

      <JudokaList
        judokas={judokas}
        isLoading={isLoading}
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

