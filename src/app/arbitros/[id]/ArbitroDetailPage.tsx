'use client'

import { use } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import Layout from '@/components/common/Layout'
import ArbitroDetail from '@/components/arbitros/ArbitroDetail'
import { useRouter } from 'next/navigation'

interface ArbitroDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ArbitroDetailPage({ params }: ArbitroDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)

  return (
    <Layout>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/arbitros')}
          sx={{ mb: 2 }}
        >
          Volver a Árbitros
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Detalle del Árbitro
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/arbitros/${id}/editar`)}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <ArbitroDetail arbitroId={id} />
    </Layout>
  )
}

