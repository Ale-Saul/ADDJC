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
  Button,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BlockIcon from '@mui/icons-material/Block'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AddIcon from '@mui/icons-material/Add'
import { MovimientoFinanciero } from '@/models/movimientoFinanciero'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'
import { formatters } from '@/utils/formatters'

interface MovimientosTableProps {
  movimientos: MovimientoFinanciero[]
  onEditar: (movimiento: MovimientoFinanciero) => void
  onEliminar: (id: string) => void
  onAnular: (id: string) => void
  onAgregar?: () => void
}

export default function MovimientosTable({
  movimientos,
  onEditar,
  onEliminar,
  onAnular,
  onAgregar,
}: MovimientosTableProps) {
  const formatCurrency = (amount: number) => {
    return `Bs. ${new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`
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

  const handleVerComprobante = async (pathOrUrl: string) => {
    // Si es una URL completa (empieza con http), abrir directamente
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      window.open(pathOrUrl, '_blank')
      return
    }

    // Si es un path (bucket privado), obtener URL firmada
    try {
      const { storageService } = await import('@/services/storageService')
      const result = await storageService.getSignedUrl('comprobantes-financieros', pathOrUrl)
      
      if (result.success && result.url) {
        window.open(result.url, '_blank')
      } else {
        alert(result.error || 'Error al obtener el comprobante')
      }
    } catch (error) {
      console.error('Error al ver comprobante:', error)
      alert('Error al abrir el comprobante')
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Movimientos Financieros
        </Typography>
        {onAgregar && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAgregar}
            sx={{ 
              textTransform: 'none',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              height: '40px'
            }}
          >
            Nuevo Movimiento
          </Button>
        )}
      </Box>
      
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
                    {formatters.formatDate(movimiento.fecha)}
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
