'use client'

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
  DialogContent,
  Button,
  TextField,
  InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import HistoryIcon from '@mui/icons-material/History'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import SearchIcon from '@mui/icons-material/Search'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Judoka } from '@/models/judoka'
import PagoForm from '@/components/forms/PagoForm'
import PagosList from '@/components/pagos/PagosList'
import HistorialPagos from '@/components/pagos/HistorialPagos'
import PagoMasivoForm from '@/components/pagos/PagoMasivoForm'
import PagosStats from '@/components/pagos/PagosStats'
import { useJudokas } from '@/hooks/useJudokas'
import { usePagos } from '@/hooks/usePagos'
import { useDialog } from '@/hooks/useDialog'

export default function PagosPage() {
  const { user } = useAuth()
  
  // Hooks personalizados
  const {
    judokas,
    isLoading: loadingJudokas,
    searchTerm,
    setSearchTerm,
  } = useJudokas({ clubId: user?.club_id, autoFetch: !!user?.club_id })

  const {
    allPagos: pagos,
    refresh: refreshPagos,
  } = usePagos({ clubId: user?.club_id })

  // Diálogos
  const pagoDialog = useDialog()
  const pagosListDialog = useDialog()
  const historialDialog = useDialog()
  const masivoDialog = useDialog()

  const handleNuevoPago = (judoka: Judoka) => {
    pagoDialog.open(judoka)
  }

  const handlePagoSuccess = () => {
    pagoDialog.close()
    refreshPagos()
  }

  const handlePagoMasivoSuccess = () => {
    masivoDialog.close()
    refreshPagos()
  }

  const judokasFiltrados = judokas.filter(j => j.club_id !== null)

  return (
    <ProtectedRoute allowedRoles={['admin', 'encargado']}>
      <Layout>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Gestión de Pagos y Cuotas
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GroupAddIcon />}
              onClick={() => masivoDialog.open()}
              disabled={judokas.length === 0}
            >
              Crear Pago para Todos
            </Button>
          </Box>

          {loadingJudokas ? (
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
            <>
              {/* Mini Dashboard de Estadísticas */}
              <PagosStats pagos={pagos} />

              <TextField
                fullWidth
                placeholder="Buscar judoka por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />

              {judokasFiltrados.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No se encontraron judokas con "{searchTerm}"
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
                      {judokasFiltrados.map((judoka) => (
                        <TableRow key={judoka.id} hover>
                          <TableCell>{judoka.nombres}</TableCell>
                          <TableCell>{judoka.apellidos}</TableCell>
                          <TableCell>{judoka.categoria || '-'}</TableCell>
                          <TableCell>{judoka.cinturon_actual || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver Pagos Pendientes">
                          <IconButton
                            color="warning"
                            onClick={() => pagosListDialog.open(judoka)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver Historial">
                          <IconButton
                            color="success"
                            onClick={() => historialDialog.open(judoka)}
                            size="small"
                          >
                            <HistoryIcon />
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
            </>
          )}
        </Box>

        <Dialog open={pagoDialog.isOpen} onClose={pagoDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Crear Nuevo Pago</DialogTitle>
          <DialogContent>
            {pagoDialog.data && (
              <PagoForm
                judokaId={pagoDialog.data.id}
                judokaNombre={`${pagoDialog.data.nombres} ${pagoDialog.data.apellidos}`}
                onSuccess={handlePagoSuccess}
                onCancel={pagoDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={pagosListDialog.isOpen} onClose={pagosListDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>
            Pagos Pendientes - {pagosListDialog.data?.nombres} {pagosListDialog.data?.apellidos}
          </DialogTitle>
          <DialogContent>
            {pagosListDialog.data && (
              <PagosList
                judokaId={pagosListDialog.data.id}
                judokaNombre={`${pagosListDialog.data.nombres} ${pagosListDialog.data.apellidos}`}
                onPagoDeleted={refreshPagos}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={historialDialog.isOpen} onClose={historialDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>
            Historial de Pagos - {historialDialog.data?.nombres} {historialDialog.data?.apellidos}
          </DialogTitle>
          <DialogContent>
            {historialDialog.data && (
              <HistorialPagos
                judokaId={historialDialog.data.id}
                judokaNombre={`${historialDialog.data.nombres} ${historialDialog.data.apellidos}`}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={masivoDialog.isOpen} onClose={masivoDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Crear Pago Masivo</DialogTitle>
          <DialogContent>
            <PagoMasivoForm
              judokas={judokas}
              onSuccess={handlePagoMasivoSuccess}
              onCancel={masivoDialog.close}
            />
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}
