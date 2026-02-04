'use client'

import { use, useState, useEffect } from 'react'
import { Box, Button, Typography, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, Divider } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
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

  useEffect(() => {
    const loadSensei = async () => {
      setLoading(true)
      setError(null)

      const response = await senseiController.getSenseiById(id)

      if (response.success && response.data) {
        setSensei(response.data)
      } else {
        setError(response.error || 'Error al cargar el sensei')
      }

      setLoading(false)
    }

    if (id) {
      loadSensei()
    }
  }, [id])

  const handleSuccess = () => {
    router.push(`/senseis`)
  }

  const handleAddCertificacion = () => {
    setCertificacionEditando(null)
    setOpenCertificacionDialog(true)
  }

  const handleEditCertificacion = (certificacion: Certificacion) => {
    setCertificacionEditando(certificacion)
    setOpenCertificacionDialog(true)
  }

  const handleDeleteCertificacion = async (certificacion: Certificacion) => {
    if (confirm(`¿Estás seguro de eliminar la certificación "${certificacion.nombre_certificacion}"?`)) {
      const response = await certificacionController.deleteCertificacion(certificacion.id)
      if (response.success) {
        setRefreshCertificaciones(prev => prev + 1)
      } else {
        alert(response.error || 'Error al eliminar la certificación')
      }
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
        </>
      )}
    </Layout>
  )
}

