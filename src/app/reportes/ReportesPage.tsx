'use client'

import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import DownloadIcon from '@mui/icons-material/Download'
import AssessmentIcon from '@mui/icons-material/Assessment'
import FilterListIcon from '@mui/icons-material/FilterList'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ClearIcon from '@mui/icons-material/Clear'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'
import { ESTADO_PAGO, TIPO_PAGO_LABELS, TIPO_DESCUENTO } from '@/constants/pagos'
import { useReportes } from '@/hooks/useReportes'

export default function ReportesPage() {
  const {
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    estadoFiltro,
    setEstadoFiltro,
    tipoFiltro,
    setTipoFiltro,
    senseiFiltro,
    setSenseiFiltro,
    clubFiltro,
    setClubFiltro,
    showFilters,
    setShowFilters,
    isAdmin,
    clubes,
    judokas,
    senseisList,
    pagosFiltrados,
    estadisticas,
    clearFilters,
    getJudokaNombre,
    getTipoLabel
  } = useReportes()

  const exportarExcel = () => {
    // Crear CSV
    const headers = ['Fecha Creación', 'Judoka', 'Concepto', 'Tipo', 'Monto Base', 'Descuento', 'Monto Final', 'Estado', 'Fecha Vencimiento', 'Fecha Pago']
    const rows = pagosFiltrados.map(p => [
      formatters.formatDate(p.created_at),
      getJudokaNombre(p.judoka_id),
      p.concepto,
      p.tipo_pago,
      p.monto_base.toFixed(2),
      p.tiene_descuento ? (p.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE ? `${p.descuento_porcentaje}%` : `Bs. ${p.descuento_monto}`) : '-',
      p.monto_final.toFixed(2),
      p.estado,
      formatters.formatDate(p.fecha_vencimiento),
      p.fecha_pago ? formatters.formatDate(p.fecha_pago) : '-'
    ])

    // Calcular totales
    const totalCobrado = pagosFiltrados
      .filter(p => p.estado === ESTADO_PAGO.PAGADO)
      .reduce((sum, p) => sum + p.monto_final, 0)
    
    const totalPendiente = pagosFiltrados
      .filter(p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO)
      .reduce((sum, p) => sum + p.monto_final, 0)

    // Agregar líneas de totales
    const totalesRows = [
      ['', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', 'TOTAL COBRADO:', totalCobrado.toFixed(2), '', '', ''],
      ['', '', '', '', '', 'TOTAL PENDIENTE:', totalPendiente.toFixed(2), '', '', ''],
      ['', '', '', '', '', 'TOTAL GENERAL:', (totalCobrado + totalPendiente).toFixed(2), '', '', '']
    ]

    // Combinar todo
    const allRows = [headers, ...rows, ...totalesRows]
    const csv = allRows.map(row => row.join(',')).join('\n')
    
    // Agregar BOM UTF-8 para que Excel reconozca correctamente los acentos
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_pagos_${fechaInicio}_${fechaFin}.csv`
    link.click()
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(18)
    doc.text('Reporte de Pagos y Cuotas', 14, 20)
    
    // Información del período
    doc.setFontSize(11)
    doc.text(`Período: ${formatters.formatDate(fechaInicio)} - ${formatters.formatDate(fechaFin)}`, 14, 28)
    doc.text(`Fecha de generación: ${formatters.formatDateTime(new Date(), true)}`, 14, 34)
    
    // Totales
    const totalCobrado = pagosFiltrados
      .filter(p => p.estado === ESTADO_PAGO.PAGADO)
      .reduce((sum, p) => sum + p.monto_final, 0)
    
    const totalPendiente = pagosFiltrados
      .filter(p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO)
      .reduce((sum, p) => sum + p.monto_final, 0)

    doc.setFontSize(10)
    doc.text(`Total Cobrado: Bs. ${totalCobrado.toFixed(2)}`, 14, 42)
    doc.text(`Total Pendiente: Bs. ${totalPendiente.toFixed(2)}`, 80, 42)
    doc.text(`Total General: Bs. ${(totalCobrado + totalPendiente).toFixed(2)}`, 146, 42)
    
    // Tabla de pagos
    const tableData = pagosFiltrados.map(p => [
      formatters.formatDate(p.created_at),
      getJudokaNombre(p.judoka_id),
      p.concepto,
      getTipoLabel(p.tipo_pago),
      `Bs. ${p.monto_final.toFixed(2)}`,
      p.estado,
      formatters.formatDate(p.fecha_vencimiento)
    ])

    autoTable(doc, {
      head: [['Fecha', 'Judoka', 'Concepto', 'Tipo', 'Monto', 'Estado', 'Vencimiento']],
      body: tableData,
      startY: 48,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 20 },
        6: { cellWidth: 22 }
      },
      didDrawPage: (data) => {
        // Numeración de páginas (lado inferior derecho, solo número)
        const str = `${doc.internal.getNumberOfPages()}`
        doc.setFontSize(10)
        const pageSize = doc.internal.pageSize
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth()
        doc.text(str, pageWidth - 15, pageHeight - 10)
      }
    })

    // Guardar PDF
    doc.save(`reporte_pagos_${fechaInicio}_${fechaFin}.pdf`)
  }

  const getEstadoChip = (estado: string) => {
    const colores: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
      [ESTADO_PAGO.PAGADO]: 'success',
      [ESTADO_PAGO.PENDIENTE]: 'warning',
      [ESTADO_PAGO.VENCIDO]: 'error',
      [ESTADO_PAGO.CANCELADO]: 'default',
      [ESTADO_PAGO.REEMBOLSADO]: 'info'
    }
    return <Chip label={estado} color={colores[estado] || 'default'} size="small" />
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'encargado']}>
        <Layout>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'encargado']}>
      <Layout>
        <Box>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                Reportes y Estadísticas
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DownloadIcon />}
                onClick={exportarPDF}
                disabled={pagosFiltrados.length === 0}
              >
                Exportar a PDF
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={exportarExcel}
                disabled={pagosFiltrados.length === 0}
              >
                Exportar a Excel
              </Button>
            </Box>
          </Box>

          {/* Filtros */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }} variant="outlined">
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, flexWrap: 'wrap' }}>
                  <DatePicker
                    label="Fecha Inicio"
                    value={fechaInicio ? dayjs(fechaInicio) : null}
                    onChange={(newValue) => {
                      setFechaInicio(newValue ? newValue.format('YYYY-MM-DD') : '')
                    }}
                    slotProps={{ textField: { size: 'small', sx: { minWidth: 150, backgroundColor: 'white' } } }}
                    format="DD/MM/YYYY"
                  />
                  <DatePicker
                    label="Fecha Fin"
                    value={fechaFin ? dayjs(fechaFin) : null}
                    onChange={(newValue) => {
                      setFechaFin(newValue ? newValue.format('YYYY-MM-DD') : '')
                    }}
                    slotProps={{ textField: { size: 'small', sx: { minWidth: 150, backgroundColor: 'white' } } }}
                    format="DD/MM/YYYY"
                  />
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FilterListIcon />}
                    endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    color={showFilters ? 'primary' : 'inherit'}
                    sx={{ 
                      backgroundColor: 'white',
                      height: '40px',
                      textTransform: 'none',
                      borderColor: showFilters ? 'primary.main' : 'rgba(0, 0, 0, 0.23)'
                    }}
                  >
                    Filtros
                  </Button>

                  {(estadoFiltro !== 'todos' || tipoFiltro !== 'todos' || senseiFiltro !== 'todos') && (
                    <Tooltip title="Limpiar filtros">
                      <IconButton onClick={clearFilters} color="warning" size="small">
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>

              <Collapse in={showFilters}>
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={2} 
                  alignItems="center"
                  sx={{ pt: 1 }}
                >
                  <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={estadoFiltro}
                      label="Estado"
                      onChange={(e) => setEstadoFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todos los estados</MenuItem>
                      <MenuItem value={ESTADO_PAGO.PENDIENTE}>Pendiente</MenuItem>
                      <MenuItem value={ESTADO_PAGO.PAGADO}>Pagado</MenuItem>
                      <MenuItem value={ESTADO_PAGO.VENCIDO}>Vencido</MenuItem>
                      <MenuItem value={ESTADO_PAGO.CANCELADO}>Cancelado</MenuItem>
                    </Select>
                  </FormControl>

                  {isAdmin && (
                    <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
                      <InputLabel>Club</InputLabel>
                      <Select
                        value={clubFiltro}
                        label="Club"
                        onChange={(e) => setClubFiltro(e.target.value)}
                      >
                        <MenuItem value="todos">Todos los clubes</MenuItem>
                        {[...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club)).map(club => (
                          <MenuItem key={club.id} value={club.id}>
                            {club.nombre_club}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
                    <InputLabel>Tipo de Pago</InputLabel>
                    <Select
                      value={tipoFiltro}
                      label="Tipo de Pago"
                      onChange={(e) => setTipoFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todos los tipos</MenuItem>
                      {Object.entries(TIPO_PAGO_LABELS).sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
                    <InputLabel>Sensei</InputLabel>
                    <Select
                      value={senseiFiltro}
                      label="Sensei"
                      onChange={(e) => setSenseiFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todos los senseis</MenuItem>
                      {senseisList.map(name => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Collapse>
            </Stack>
          </Paper>

          {/* Resumen Estadísticas */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <Card sx={{ flex: '1 1 calc(33.33% - 12px)', minWidth: '250px', bgcolor: '#66BB6A' }}>
              <CardContent>
                <Typography variant="caption" color="#000" fontWeight="bold">TOTAL GENERADO</Typography>
                <Typography variant="h4" fontWeight="bold" color="#000">
                  Bs. {estadisticas.totalGenerado.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="#000">
                  {pagosFiltrados.filter(p => p.estado === ESTADO_PAGO.PAGADO).length} pagos cobrados
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 calc(33.33% - 12px)', minWidth: '250px', bgcolor: '#FFA726' }}>
              <CardContent>
                <Typography variant="caption" color="#000" fontWeight="bold">TOTAL PENDIENTE</Typography>
                <Typography variant="h4" fontWeight="bold" color="#000">
                  Bs. {estadisticas.totalPendiente.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="#000">
                  {pagosFiltrados.filter(p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO).length} pagos pendientes
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 calc(33.33% - 12px)', minWidth: '250px', bgcolor: '#EF5350' }}>
              <CardContent>
                <Typography variant="caption" color="#000" fontWeight="bold">TOTAL VENCIDO</Typography>
                <Typography variant="h4" fontWeight="bold" color="#000">
                  Bs. {estadisticas.totalVencido.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="#000">
                  {pagosFiltrados.filter(p => p.estado === ESTADO_PAGO.VENCIDO).length} pagos vencidos
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Desglose por Tipo de Pago */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={2}>Desglose por Tipo de Pago</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Total Generado</TableCell>
                    <TableCell align="right">Cobrado</TableCell>
                    <TableCell align="right">Pendiente</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(estadisticas.porTipo).map(([tipo, datos]) => (
                    <TableRow key={tipo}>
                      <TableCell>{getTipoLabel(tipo)}</TableCell>
                      <TableCell align="right">{datos.cantidad}</TableCell>
                      <TableCell align="right">Bs. {datos.total.toFixed(2)}</TableCell>
                      <TableCell align="right">Bs. {datos.pagado.toFixed(2)}</TableCell>
                      <TableCell align="right">Bs. {(datos.total - datos.pagado).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Desglose por Estado */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={2}>Desglose por Estado</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Monto Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(estadisticas.porEstado).map(([estado, datos]) => (
                    <TableRow key={estado}>
                      <TableCell>{getEstadoChip(estado)}</TableCell>
                      <TableCell align="right">{datos.cantidad}</TableCell>
                      <TableCell align="right">Bs. {datos.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Lista detallada de pagos */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Detalle de Pagos ({pagosFiltrados.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Judoka</TableCell>
                    {isAdmin && <TableCell>Club</TableCell>}
                    <TableCell>Concepto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Vencimiento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosFiltrados.map((pago) => {
                    return (
                      <TableRow key={pago.id} hover>
                        <TableCell>
                          {formatters.formatDate(pago.created_at)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getJudokaNombre(pago.judoka_id)}
                          </Typography>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Typography variant="body2">
                              {clubes.find(c => c.id === pago.club_id)?.nombre_club || '-'}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>{pago.concepto}</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {getTipoLabel(pago.tipo_pago)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            Bs. {pago.monto_final.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>{getEstadoChip(pago.estado)}</TableCell>
                        <TableCell>
                          {formatters.formatDate(pago.fecha_vencimiento)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Layout>
    </ProtectedRoute>
  )
}
