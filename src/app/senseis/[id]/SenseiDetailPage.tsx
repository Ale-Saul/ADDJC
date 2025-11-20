'use client'

import { use } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import Layout from '@/components/common/Layout'
import SenseiDetail from '@/components/senseis/SenseiDetail'
import { useRouter } from 'next/navigation'

interface SenseiDetailPageProps {
  params: Promise<{ id: string }>
}

export default function SenseiDetailPage({ params }: SenseiDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)

  return (
    <Layout>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/senseis')}
          sx={{ mb: 2 }}
        >
          Volver a Senseis
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Detalle del Sensei
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/senseis/${id}/editar`)}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <SenseiDetail senseiId={id} />
    </Layout>
  )
}

