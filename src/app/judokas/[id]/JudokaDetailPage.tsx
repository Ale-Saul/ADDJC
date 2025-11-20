'use client'

import { use } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import Layout from '@/components/common/Layout'
import JudokaDetail from '@/components/judokas/JudokaDetail'
import { useRouter } from 'next/navigation'

interface JudokaDetailPageProps {
  params: Promise<{ id: string }>
}

export default function JudokaDetailPage({ params }: JudokaDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)

  return (
    <Layout>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/judokas')}
          sx={{ mb: 2 }}
        >
          Volver a Judokas
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Detalle del Judoka
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/judokas/${id}/editar`)}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <JudokaDetail judokaId={id} />
    </Layout>
  )
}

