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
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { judokaController } from '@/controllers/judokaController'
import { Judoka } from '@/models/judoka'
import PagoForm from '@/components/forms/PagoForm'
import PagosList from '@/components/pagos/PagosList'

export default function PagosPage() {
  const { user } = useAuth()
  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openPagosDialog, setOpenPagosDialog] = useState(false)
  const [selectedJudoka, setSelectedJudoka] = useState<Judoka | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchJudokas = async () => {
      if (!user?.club_id) {
        setLoading(false)
        return
      }

      try {
        const response = await judokaController.getJudokasByClub(user.club_id)
        if (response.success && response.data) {
          // Filtrar solo judokas que están inscritos en el club (club_id no null)
          const judokasInscritos = response.data.filter(j => j.club_id !== null)
          setJudokas(judokasInscritos)
        }
      } catch (error) {
        console.error('Error al cargar judokas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJudokas()
  }, [user?.club_id, refreshTrigger])

  const handleNuevoPago = (judoka: Judoka) => {
    setSelectedJudoka(judoka)
    setOpenDialog(true)
  }

  const handlePagoSuccess = () => {
    setOpenDialog(false)
    setSelectedJudoka(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleVerPagos = (judoka: Judoka) => {
    setSelectedJudoka(judoka)
    setOpenPagosDialog(true)
  }

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
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {judokas.map((judoka) => (
                    <TableRow key={judoka.id} hover>
                      <TableCell>{judoka.nombres}</TableCell>
                      <TableCell>{judoka.apellidos}</TableCell>
                      <TableCell>{judoka.categoria || '-'}</TableCell>
                      <TableCell>{judoka.cinturon_actual || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver Pagos">
                          <IconButton
                            color="info"
                            onClick={() => handleVerPagos(judoka)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Nuevo Pago">
                          <IconButton
                            color="primary"
                            onClick={() => handleNuevoPago(judoka)}
                            size="small"
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Crear Nuevo Pago</DialogTitle>
          <DialogContent>
            {selectedJudoka && (
              <PagoForm
                judokaId={selectedJudoka.id}
                judokaNombre={`${selectedJudoka.nombres} ${selectedJudoka.apellidos}`}
                onSuccess={handlePagoSuccess}
                onCancel={() => setOpenDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={openPagosDialog} onClose={() => setOpenPagosDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Pagos de {selectedJudoka?.nombres} {selectedJudoka?.apellidos}
          </DialogTitle>
          <DialogContent>
            {selectedJudoka && (
              <PagosList
                judokaId={selectedJudoka.id}
                judokaNombre={`${selectedJudoka.nombres} ${selectedJudoka.apellidos}`}
                onPagoDeleted={() => setRefreshTrigger(prev => prev + 1)}
              />
            )}
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}
