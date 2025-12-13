import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BlockIcon from '@mui/icons-material/Block'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { MovimientoFinanciero } from '@/models/movimientoFinanciero'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'

interface MovimientosTableProps {
  movimientos: MovimientoFinanciero[]
  onEditar: (movimiento: MovimientoFinanciero) => void
  onEliminar: (id: string) => void
  onAnular: (id: string) => void
}

export default function MovimientosTable({
  movimientos,
  onEditar,
  onEliminar,
  onAnular,
}: MovimientosTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTipoColor = (tipo: string) => {
    return tipo === 'ingreso' ? 'success' : 'error'
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'registrado':
        return 'default'
      case 'aprobado':
        return 'success'
      case 'anulado':
        return 'error'
      default:
        return 'default'
    }
  }

  const handleVerComprobante = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Movimientos Financieros
      </Typography>
      
      {movimientos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No hay movimientos registrados para el período seleccionado
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.map((movimiento) => (
                <TableRow key={movimiento.id} hover>
                  <TableCell>
                    {new Date(movimiento.fecha).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        movimiento.tipo === 'ingreso' ? (
                          <TrendingUpIcon />
                        ) : (
                          <TrendingDownIcon />
                        )
                      }
                      label={movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      color={getTipoColor(movimiento.tipo)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {movimientoFinancieroController.getCategoriaLabel(
                      movimiento.categoria
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {movimiento.concepto}
                    </Typography>
                    {movimiento.descripcion && (
                      <Typography variant="caption" color="text.secondary">
                        {movimiento.descripcion}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {movimiento.origen_club_nombre || movimiento.origen_entidad || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color:
                          movimiento.tipo === 'ingreso'
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {movimiento.tipo === 'ingreso' ? '+' : '-'}
                      {formatCurrency(movimiento.monto)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={movimiento.estado}
                      color={getEstadoColor(movimiento.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {movimiento.comprobante_url && (
                        <Tooltip title="Ver comprobante">
                          <IconButton
                            size="small"
                            onClick={() => handleVerComprobante(movimiento.comprobante_url!)}
                          >
                            <AttachFileIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {movimiento.estado !== 'anulado' && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => onEditar(movimiento)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Anular">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => onAnular(movimiento.id)}
                            >
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onEliminar(movimiento.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}
