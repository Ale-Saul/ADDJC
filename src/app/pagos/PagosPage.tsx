'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { judokaController } from '@/controllers/judokaController'
import { Judoka } from '@/models/judoka'

export default function PagosPage() {
  const { user } = useAuth()
  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJudokas = async () => {
      if (!user?.club_id) {
        setLoading(false)
        return
      }

      try {
        const response = await judokaController.getJudokasByClub(user.club_id)
        if (response.success && response.data) {
          setJudokas(response.data)
        }
      } catch (error) {
        console.error('Error al cargar judokas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJudokas()
  }, [user?.club_id])

  return (
    <ProtectedRoute allowedRoles={['encargado']}>
      <Layout>
        <Box>
          <Typography variant="h4" component="h1" mb={3}>
            Gestión de Pagos y Cuotas
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : judokas.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay judokas registrados en tu club
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Apellidos</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Cinturón</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {judokas.map((judoka) => (
                    <TableRow key={judoka.id} hover>
                      <TableCell>{judoka.nombres}</TableCell>
                      <TableCell>{judoka.apellidos}</TableCell>
                      <TableCell>{judoka.categoria || '-'}</TableCell>
                      <TableCell>{judoka.cinturon_actual || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Layout>
    </ProtectedRoute>
  )
}
