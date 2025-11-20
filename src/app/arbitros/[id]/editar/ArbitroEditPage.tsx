'use client'

import { use, useState, useEffect } from 'react'
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
import ArbitroForm from '@/components/arbitros/ArbitroForm'
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
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

  useEffect(() => {
    const loadArbitro = async () => {
      setLoading(true)
      setError(null)

      const response = await arbitroController.getArbitroById(id)

      if (response.success && response.data) {
        setArbitro(response.data)
      } else {
        setError(response.error || 'Error al cargar el árbitro')
      }

      setLoading(false)
    }

    if (id) {
      loadArbitro()
    }
  }, [id])

  const handleSuccess = () => {
    router.push(`/arbitros/${id}`)
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
          onClick={() => router.push(`/arbitros/${id}`)}
          sx={{ mb: 2 }}
        >
          Volver al Detalle
        </Button>
        
        <Typography variant="h4" component="h1">
          Editar Árbitro
        </Typography>
      </Box>

      {arbitro && (
        <ArbitroForm
          arbitro={arbitro}
          onSuccess={handleSuccess}
          onCancel={() => router.push(`/arbitros/${id}`)}
        />
      )}
    </Layout>
  )
}

