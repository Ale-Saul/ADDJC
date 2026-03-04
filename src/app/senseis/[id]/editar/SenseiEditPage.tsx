'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, Snackbar, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import SenseiForm from '@/components/senseis/SenseiForm'
import CertificacionList from '@/components/certificaciones/CertificacionList'
import CertificacionForm from '@/components/certificaciones/CertificacionForm'
import { Sensei } from '@/models/sensei'
import { Certificacion } from '@/models/certificacion'
import { senseiController } from '@/controllers/senseiController'
import { certificacionController } from '@/controllers/certificacionController'
import { useRouter } from 'next/navigation'

interface SenseiEditPageProps {
  params: Promise<{ id: string }>
}

export default function SenseiEditPage({ params }: SenseiEditPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [sensei, setSensei] = useState<Sensei | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openCertificacionDialog, setOpenCertificacionDialog] = useState(false)
  const [certificacionEditando, setCertificacionEditando] = useState<Certificacion | null>(null)
  const [refreshCertificaciones, setRefreshCertificaciones] = useState(0)
  const [certToDelete, setCertToDelete] = useState<Certificacion | null>(null)
  const [certDeleteLoading, setCertDeleteLoading] = useState(false)
  const [certDeleteError, setCertDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadSensei = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await senseiController.getSenseiById(id)

    if (response.success && response.data) {
      setSensei(response.data)
    } else {
      setError(response.error || 'Error al cargar el sensei')
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    if (id) {
      loadSensei()
    }
  }, [id, loadSensei])

  const handleSuccess = () => {
    setSuccessMessage('Sensei actualizado exitosamente')
    loadSensei()
  }

  const handleAddCertificacion = () => {
    setCertificacionEditando(null)
    setOpenCertificacionDialog(true)
  }

  const handleEditCertificacion = (certificacion: Certificacion) => {
    setCertificacionEditando(certificacion)
    setOpenCertificacionDialog(true)
  }

  const handleDeleteCertificacion = (certificacion: Certificacion) => {
    setCertToDelete(certificacion)
  }

  const handleConfirmDeleteCertificacion = async () => {
    if (!certToDelete) return
    setCertDeleteLoading(true)
    try {
      const response = await certificacionController.deleteCertificacion(certToDelete.id)
      if (response.success) {
        setCertToDelete(null)
        setRefreshCertificaciones(prev => prev + 1)
      } else {
        setCertDeleteError(response.error || 'Error al eliminar la certificación')
        setCertToDelete(null)
      }
    } catch {
      setCertDeleteError('Error inesperado al eliminar la certificación')
      setCertToDelete(null)
    } finally {
      setCertDeleteLoading(false)
    }
  }

  const handleCertificacionSuccess = () => {
    setOpenCertificacionDialog(false)
    setCertificacionEditando(null)
    setRefreshCertificaciones(prev => prev + 1)
  }

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">{error}</Alert>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/senseis`)}
          sx={{ mb: 2 }}
        >
          Volver a la Lista
        </Button>
        
        <Typography variant="h4" component="h1">
          Editar Sensei
        </Typography>
      </Box>

      {sensei && (
        <>
          <SenseiForm
            sensei={sensei}
            onSuccess={handleSuccess}
            onCancel={() => router.push(`/senseis`)}
          />

          <Divider sx={{ my: 4 }} />

          <Box>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Certificaciones
            </Typography>
            <CertificacionList
              usuarioId={sensei.usuario_id}
              tipoAfiliado="sensei"
              onAdd={handleAddCertificacion}
              onEdit={handleEditCertificacion}
              onDelete={handleDeleteCertificacion}
              refreshTrigger={refreshCertificaciones}
            />
          </Box>

          <Dialog
            open={openCertificacionDialog}
            onClose={() => {
              setOpenCertificacionDialog(false)
              setCertificacionEditando(null)
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {certificacionEditando ? 'Editar Certificación' : 'Nueva Certificación'}
            </DialogTitle>
            <DialogContent>
              <CertificacionForm
                certificacion={certificacionEditando}
                usuarioId={sensei.usuario_id}
                tipoAfiliado="sensei"
                onSuccess={handleCertificacionSuccess}
                onCancel={() => {
                  setOpenCertificacionDialog(false)
                  setCertificacionEditando(null)
                }}
              />
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={!!certToDelete}
            title="Eliminar Certificación"
            message={certToDelete ? `¿Estás seguro de eliminar la certificación "${certToDelete.nombre_certificacion}"?` : ''}
            onConfirm={handleConfirmDeleteCertificacion}
            onClose={() => setCertToDelete(null)}
            confirmText="Eliminar"
            loading={certDeleteLoading}
          />

          <Snackbar
            open={!!certDeleteError}
            autoHideDuration={4000}
            onClose={() => setCertDeleteError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={() => setCertDeleteError(null)}>{certDeleteError}</Alert>
          </Snackbar>

          <Snackbar
            open={!!successMessage}
            autoHideDuration={4000}
            onClose={() => setSuccessMessage(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
          </Snackbar>
        </>
      )}
    </Layout>
  )
}

