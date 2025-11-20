'use client'

import { use, useState, useEffect } from 'react'
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
import SenseiForm from '@/components/senseis/SenseiForm'
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
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
        <SenseiForm
          sensei={sensei}
          onSuccess={handleSuccess}
          onCancel={() => router.push(`/senseis`)}
        />
      )}
    </Layout>
  )
}

