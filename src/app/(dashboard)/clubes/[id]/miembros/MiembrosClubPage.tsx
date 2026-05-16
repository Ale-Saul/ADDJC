'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Button, Tabs, Tab, Breadcrumbs, Dialog, Snackbar, Alert } from '@mui/material'
import Link from 'next/link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { ROL } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useDialog } from '@/hooks/useDialog'
import SenseiList from '@/components/senseis/SenseiList'
import JudokaList from '@/components/judokas/JudokaList'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { judokaController } from '@/controllers/judokaController'
import { Club } from '@/models/club'
import { Sensei } from '@/models/sensei'
import { Judoka } from '@/models/judoka'

interface MiembrosClubPageProps {
  clubId: string
}

export default function MiembrosClubPage({ clubId }: MiembrosClubPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const isAdminOrAsoc = user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION
  const isReadOnly = false // Administrador y Asociación sí puede editar y eliminar
  
  const [tabIndex, setTabIndex] = useState(0)
  const [clubContext, setClubContext] = useState<Club | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Dialogs de eliminación
  const deleteSenseiDialog = useDialog<Sensei>()
  const deleteJudokaDialog = useDialog<Judoka>()
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClub = async () => {
      const result = await clubController.getClubById(clubId)
      if (result.success && result.data) {
        setClubContext(result.data)
      }
    }
    fetchClub()
  }, [clubId])

  // --- SENSEIS ---
  const handleEditSensei = (sensei: Sensei) => {
    router.push(`/senseis/${sensei.id}/editar`)
  }

  const handleDeleteSensei = (sensei: Sensei) => {
    deleteSenseiDialog.open(sensei)
  }

  const handleConfirmDeleteSensei = async () => {
    if (!deleteSenseiDialog.data) return
    setDeleteLoading(true)
    try {
      const response = await senseiController.deleteSensei(deleteSenseiDialog.data.id)
      if (response.success) {
        deleteSenseiDialog.close()
        setRefreshTrigger(prev => prev + 1)
      } else {
        setDeleteError(response.error || 'Error al eliminar sensei')
        deleteSenseiDialog.close()
      }
    } catch {
      setDeleteError('Error inesperado al eliminar sensei')
      deleteSenseiDialog.close()
    } finally {
      setDeleteLoading(false)
    }
  }

  // --- JUDOKAS ---
  const handleEditJudoka = (judoka: Judoka) => {
    router.push(`/judokas/${judoka.id}/editar`)
  }

  const handleDeleteJudoka = (judoka: Judoka) => {
    deleteJudokaDialog.open(judoka)
  }

  const handleConfirmDeleteJudoka = async () => {
    if (!deleteJudokaDialog.data) return
    setDeleteLoading(true)
    try {
      const response = await judokaController.deleteJudoka(deleteJudokaDialog.data.id)
      if (response.success) {
        deleteJudokaDialog.close()
        setRefreshTrigger(prev => prev + 1)
      } else {
        setDeleteError(response.error || 'Error al eliminar judoka')
        deleteJudokaDialog.close()
      }
    } catch {
      setDeleteError('Error inesperado al eliminar judoka')
      deleteJudokaDialog.close()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION]}>
      <Box mb={4}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb" 
          sx={{ mb: 2 }}
        >
          <Link href="/clubes" style={{ textDecoration: 'none', color: 'inherit' }}>
            Clubes
          </Link>
          <Typography color="text.primary">Miembros del Club</Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            {clubContext?.nombre_club ? `Miembros del club: ${clubContext.nombre_club}` : 'Miembros del Club'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            href="/clubes"
          >
            Volver a la Lista
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabIndex} 
          onChange={(_, newValue) => setTabIndex(newValue)} 
          aria-label="tabs miembros"
        >
          <Tab label="Senseis" />
          <Tab label="Judokas" />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <SenseiList 
          readOnly={isReadOnly} 
          clubId={clubId}
          onEdit={handleEditSensei}
          onDelete={handleDeleteSensei}
          refreshTrigger={refreshTrigger}
        />
      )}
      
      {tabIndex === 1 && (
        <JudokaList 
          readOnly={isReadOnly} 
          clubId={clubId} 
          onEdit={handleEditJudoka}
          onDelete={handleDeleteJudoka}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Dialogos de confirmación en miembros de club */}
      <ConfirmDialog
        open={deleteSenseiDialog.isOpen}
        title="Eliminar Sensei"
        message={deleteSenseiDialog.data ? `¿Estás seguro de eliminar a ${deleteSenseiDialog.data.nombres} ${deleteSenseiDialog.data.apellidos}? Esta acción no se puede deshacer.` : ''}
        onConfirm={handleConfirmDeleteSensei}
        onClose={deleteSenseiDialog.close}
        confirmText="Eliminar"
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={deleteJudokaDialog.isOpen}
        title="Eliminar Judoka"
        message={deleteJudokaDialog.data ? `¿Estás seguro de eliminar a ${deleteJudokaDialog.data.nombres} ${deleteJudokaDialog.data.apellidos}? Esta acción no se puede deshacer.` : ''}
        onConfirm={handleConfirmDeleteJudoka}
        onClose={deleteJudokaDialog.close}
        confirmText="Eliminar"
        loading={deleteLoading}
      />

      {/* Manejo de errores de eliminación */}
      <Snackbar
        open={!!deleteError}
        autoHideDuration={4000}
        onClose={() => setDeleteError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setDeleteError(null)}>{deleteError}</Alert>
      </Snackbar>
    </ProtectedRoute>
  )
}
