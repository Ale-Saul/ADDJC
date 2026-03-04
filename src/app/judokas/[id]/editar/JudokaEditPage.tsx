'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { Box, Button, Typography, CircularProgress, Alert, Snackbar } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
import JudokaForm from '@/components/judokas/JudokaForm'
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'
import { useRouter } from 'next/navigation'

interface JudokaEditPageProps {
  params: Promise<{ id: string }>
}

export default function JudokaEditPage({ params }: JudokaEditPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [judoka, setJudoka] = useState<Judoka | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadJudoka = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await judokaController.getJudokaById(id)

    if (response.success && response.data) {
      setJudoka(response.data)
    } else {
      setError(response.error || 'Error al cargar el judoka')
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    if (id) {
      loadJudoka()
    }
  }, [id, loadJudoka])

  const handleSuccess = () => {
    setSuccessMessage('Judoka actualizado exitosamente')
    loadJudoka()
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
          onClick={() => router.push(`/judokas`)}
          sx={{ mb: 2 }}
        >
          Volver a la Lista
        </Button>
        
        <Typography variant="h4" component="h1">
          Editar Judoka
        </Typography>
      </Box>

      {judoka && (
        <JudokaForm
          judoka={judoka}
          onSuccess={handleSuccess}
          onCancel={() => router.push(`/judokas`)}
        />
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
      </Snackbar>
    </Layout>
  )
}

