'use client'

import { use } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import Layout from '@/components/common/Layout'
import ClubDetail from '@/components/clubes/ClubDetail'
import { useRouter } from 'next/navigation'

interface ClubDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ClubDetailPage({ params }: ClubDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)

  return (
    <Layout>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/clubes')}
          sx={{ mb: 2 }}
        >
          Volver a Clubes
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Detalle del Club
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/clubes/${id}/editar`)}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <ClubDetail clubId={id} />
    </Layout>
  )
}

