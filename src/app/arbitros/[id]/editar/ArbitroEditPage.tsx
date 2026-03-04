'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, Snackbar, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ArbitroForm from '@/components/arbitros/ArbitroForm'
import CertificacionList from '@/components/certificaciones/CertificacionList'
import CertificacionForm from '@/components/certificaciones/CertificacionForm'
import { Arbitro } from '@/models/arbitro'
import { Certificacion } from '@/models/certificacion'
import { arbitroController } from '@/controllers/arbitroController'
import { certificacionController } from '@/controllers/certificacionController'
import { useRouter } from 'next/navigation'

interface ArbitroEditPageProps {
  params: Promise<{ id: string }>
}

export default function ArbitroEditPage({ params }: ArbitroEditPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [arbitro, setArbitro] = useState<Arbitro | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openCertificacionDialog, setOpenCertificacionDialog] = useState(false)
  const [certificacionEditando, setCertificacionEditando] = useState<Certificacion | null>(null)
  const [refreshCertificaciones, setRefreshCertificaciones] = useState(0)
  const [certToDelete, setCertToDelete] = useState<Certificacion | null>(null)
  const [certDeleteLoading, setCertDeleteLoading] = useState(false)
  const [certDeleteError, setCertDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadArbitro = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await arbitroController.getArbitroById(id)

    if (response.success && response.data) {
      setArbitro(response.data)
    } else {
      setError(response.error || 'Error al cargar el árbitro')
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    if (id) {
      loadArbitro()
    }
  }, [id, loadArbitro])

  const handleSuccess = () => {
    setSuccessMessage('Árbitro actualizado exitosamente')
    loadArbitro()
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
          onClick={() => router.push(`/arbitros`)}
          sx={{ mb: 2 }}
        >
          Volver a la Lista
        </Button>
        
        <Typography variant="h4" component="h1">
          Editar Árbitro
        </Typography>
      </Box>

      {arbitro && (
        <>
          <ArbitroForm
            arbitro={arbitro}
            onSuccess={handleSuccess}
            onCancel={() => router.push(`/arbitros`)}
          />

          <Divider sx={{ my: 4 }} />

          <Box>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Certificaciones
            </Typography>
            <CertificacionList
              usuarioId={arbitro.usuario_id}
              tipoAfiliado="arbitro"
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
                usuarioId={arbitro.usuario_id}
                tipoAfiliado="arbitro"
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

