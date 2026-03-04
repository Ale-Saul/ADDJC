'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { Box, Button, Typography, CircularProgress, Alert, Snackbar } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Layout from '@/components/common/Layout'
import ClubForm from '@/components/clubes/ClubForm'
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import { useRouter } from 'next/navigation'

interface ClubEditPageProps {
  params: Promise<{ id: string }>
}

export default function ClubEditPage({ params }: ClubEditPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadClub = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await clubController.getClubById(id)

    if (response.success && response.data) {
      setClub(response.data)
    } else {
      setError(response.error || 'Error al cargar el club')
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    if (id) {
      loadClub()
    }
  }, [id, loadClub])

  const handleSuccess = () => {
    setSuccessMessage('Club actualizado exitosamente')
    loadClub()
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
          onClick={() => router.push(`/clubes`)}
          sx={{ mb: 2 }}
        >
          Volver a la Lista
        </Button>
        
        <Typography variant="h4" component="h1">
          Editar Club
        </Typography>
      </Box>

      {club && (
        <ClubForm
          club={club}
          onSuccess={handleSuccess}
          onCancel={() => router.push(`/clubes`)}
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

