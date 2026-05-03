'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  Paper,
} from '@mui/material'
import { AsistenciaDetalle } from '@/models/asistencia'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

interface Props {
  historial: AsistenciaDetalle[]
  maxRows?: number
}

export default function HistorialTable({ historial, maxRows }: Props) {
  const rows = maxRows ? historial.slice(0, maxRows) : historial

  if (rows.length === 0) {
    return (
      <Box textAlign="center" py={4} color="text.secondary">
        <Typography variant="body2">Sin registros de asistencia en el período seleccionado.</Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small" aria-label="Historial de asistencia">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Clase / Tema</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow
              key={row.id}
              sx={{
                '&:last-child td': { border: 0 },
                transition: 'background-color 150ms ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <TableCell>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {row.sesion_fecha
                    ? dayjs(row.sesion_fecha).format('ddd D MMM YYYY')
                    : '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color={row.sesion_titulo ? 'text.primary' : 'text.disabled'}>
                  {row.sesion_titulo ?? 'Sin título'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={row.estado === 'presente' ? 'Presente' : 'Ausente'}
                  color={row.estado === 'presente' ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                  sx={{ minWidth: 80 }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
