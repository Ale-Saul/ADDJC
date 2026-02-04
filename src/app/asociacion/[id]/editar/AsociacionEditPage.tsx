'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import MiembroAsociacionForm from '@/components/asociacion/MiembroAsociacionForm'
import { MiembroAsociacion } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'

export default function AsociacionEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [miembro, setMiembro] = useState<MiembroAsociacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadMiembro()
    }
  }, [id])

  const loadMiembro = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await asociacionController.getMiembroById(id)
      
      if (response.success && response.data) {
        setMiembro(response.data)
      } else {
        setError(response.error || 'Error al cargar el miembro')
      }
    } catch (err) {
      setError('Error inesperado al cargar el miembro')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/asociacion')
  }

  const handleCancel = () => {
    router.push('/asociacion')
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'asociacion']}>
        <Layout>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (error || !miembro) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'asociacion']}>
        <Layout>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Miembro no encontrado'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/asociacion')}
          >
            Volver a la Lista
          </Button>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['asociacion']}>
      <Layout>
        <Box mb={3}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/asociacion')}
            sx={{ mb: 2 }}
          >
            Volver a la Lista
          </Button>
          <Typography variant="h4" component="h1">
            Editar Miembro de la Asociación
          </Typography>
        </Box>

        <MiembroAsociacionForm
          miembro={miembro}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Layout>
    </ProtectedRoute>
  )
}

