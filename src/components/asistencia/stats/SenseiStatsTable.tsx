'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Typography,
  Paper,
  Box,
  TableSortLabel,
} from '@mui/material'
import { useState } from 'react'
import { AsistenciaStatsJudoka } from '@/models/asistencia'

type SortKey = 'nombre' | 'porcentaje' | 'total_sesiones' | 'presentes'
type SortDir = 'asc' | 'desc'

interface Props {
  stats: AsistenciaStatsJudoka[]
}

function getColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
}

function getLinearColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
}

export default function SenseiStatsTable({ stats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...stats].sort((a, b) => {
    let va: string | number
    let vb: string | number

    if (sortKey === 'nombre') {
      va = `${a.apellido_judoka ?? ''} ${a.nombre_judoka ?? ''}`.toLowerCase()
      vb = `${b.apellido_judoka ?? ''} ${b.nombre_judoka ?? ''}`.toLowerCase()
    } else {
      va = a[sortKey]
      vb = b[sortKey]
    }

    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  if (stats.length === 0) {
    return (
      <Box textAlign="center" py={4} color="text.secondary">
        <Typography variant="body2">Sin datos para el período seleccionado.</Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small" aria-label="Estadísticas de asistencia por estudiante">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>
              <TableSortLabel
                active={sortKey === 'nombre'}
                direction={sortKey === 'nombre' ? sortDir : 'asc'}
                onClick={() => handleSort('nombre')}
              >
                Judoka
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={sortKey === 'total_sesiones'}
                direction={sortKey === 'total_sesiones' ? sortDir : 'desc'}
                onClick={() => handleSort('total_sesiones')}
              >
                Sesiones
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={sortKey === 'presentes'}
                direction={sortKey === 'presentes' ? sortDir : 'desc'}
                onClick={() => handleSort('presentes')}
              >
                Presentes
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortKey === 'porcentaje'}
                direction={sortKey === 'porcentaje' ? sortDir : 'desc'}
                onClick={() => handleSort('porcentaje')}
              >
                % Asistencia
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map(row => {
            const pct = Math.round(row.porcentaje)
            const color = getColor(pct)
            return (
              <TableRow
                key={row.judoka_id}
                sx={{
                  '&:last-child td': { border: 0 },
                  transition: 'background-color 150ms ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="500">
                    {row.apellido_judoka
                      ? `${row.apellido_judoka}, ${row.nombre_judoka ?? ''}`
                      : (row.nombre_judoka ?? row.judoka_id)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{row.total_sesiones}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{row.presentes}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      color={getLinearColor(pct)}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      aria-label={`${pct}%`}
                    />
                    <Chip
                      label={`${pct}%`}
                      color={color}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 54 }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
