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

type SortKey = 'nombre' | 'porcentaje' | 'total_sesiones' | 'presentes' | 'tardes' | 'permisos' | 'ausentes'
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
      va = (a[sortKey] ?? 0) as number
      vb = (b[sortKey] ?? 0) as number
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
      <Table size="small" aria-label="Estadísticas de asistencia por futbolista">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>
              <TableSortLabel
                active={sortKey === 'nombre'}
                direction={sortKey === 'nombre' ? sortDir : 'asc'}
                onClick={() => handleSort('nombre')}
              >
                Futbolista
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
            <TableCell align="center">
              <TableSortLabel
                active={sortKey === 'tardes'}
                direction={sortKey === 'tardes' ? sortDir : 'desc'}
                onClick={() => handleSort('tardes')}
              >
                Tardes
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={sortKey === 'permisos'}
                direction={sortKey === 'permisos' ? sortDir : 'desc'}
                onClick={() => handleSort('permisos')}
              >
                Permisos
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={sortKey === 'ausentes'}
                direction={sortKey === 'ausentes' ? sortDir : 'desc'}
                onClick={() => handleSort('ausentes')}
              >
                Ausentes
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
                  <Typography variant="body2" fontWeight="600">
                    {row.apellido_judoka
                      ? `${row.apellido_judoka}, ${row.nombre_judoka ?? ''}`
                      : (row.nombre_judoka ?? row.judoka_id)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{row.total_sesiones}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.presentes}
                    size="small"
                    color={row.presentes > 0 ? 'success' : 'default'}
                    variant={row.presentes > 0 ? 'filled' : 'outlined'}
                    sx={{ minWidth: 32, height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.tardes ?? 0}
                    size="small"
                    color={(row.tardes ?? 0) > 0 ? 'warning' : 'default'}
                    variant={(row.tardes ?? 0) > 0 ? 'filled' : 'outlined'}
                    sx={{ minWidth: 32, height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.permisos ?? 0}
                    size="small"
                    color={(row.permisos ?? 0) > 0 ? 'info' : 'default'}
                    variant={(row.permisos ?? 0) > 0 ? 'filled' : 'outlined'}
                    sx={{ minWidth: 32, height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    color={row.ausentes > 0 ? 'error.main' : 'text.secondary'}
                    fontWeight={row.ausentes > 0 ? 600 : 400}
                  >
                    {row.ausentes}
                  </Typography>
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
                      sx={{ minWidth: 54, fontWeight: 600 }}
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
