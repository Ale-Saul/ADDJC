'use client'

import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  Chip
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ClearIcon from '@mui/icons-material/Clear'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'
import { ESTADO_PAGO } from '@/constants/pagos'
import { useReportesAsociacion } from '@/hooks/useReportesAsociacion'

export default function ReportesAsociacionPage() {
  const {
    clubes,
    judokas,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    clubSeleccionado,
    setClubSeleccionado,
    vistaDetalle,
    setVistaDetalle,
    clearFilters,
    resumenesPorClub,
    pagosConDetalles,
    resumenesPorJudoka,
    totalesGenerales,
    getTipoLabel
  } = useReportesAsociacion()

  const exportarPDF = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(18)
    const titulo = vistaDetalle === 'club' 
      ? 'Reporte Consolidado por Club - Asociación de Judo'
      : vistaDetalle === 'judokas'
      ? 'Reporte Consolidado por Judoka - Asociación de Judo'
      : 'Reporte Detallado de Pagos - Asociación de Judo'
    doc.text(titulo, 14, 20)
    
    // Información
    doc.setFontSize(11)
    doc.text(`Período: ${formatters.formatDate(fechaInicio)} - ${formatters.formatDate(fechaFin)}`, 14, 28)
    doc.text(`Fecha de generación: ${formatters.formatDateTime(new Date(), true)}`, 14, 34)
    
    if (vistaDetalle === 'club') {
      // Totales generales
      doc.setFontSize(10)
      doc.text(`Total Cobrado: Bs. ${totalesGenerales.totalCobrado.toFixed(2)}`, 14, 42)
      doc.text(`Total Pendiente: Bs. ${totalesGenerales.totalPendiente.toFixed(2)}`, 80, 42)
      doc.text(`Clubes Activos: ${totalesGenerales.clubesActivos}/${totalesGenerales.cantidadClubes}`, 146, 42)
      
      // Tabla de clubes
      const tableData = resumenesPorClub.map(r => [
        r.club.nombre_club,
        r.cantidadJudokas.toString(),
        `Bs. ${r.totalCobrado.toFixed(2)}`,
        `Bs. ${r.totalPendiente.toFixed(2)}`,
        `Bs. ${r.totalVencido.toFixed(2)}`
      ])

      autoTable(doc, {
        head: [['Club', 'Judokas', 'Cobrado', 'Pendiente', 'Vencido']],
        body: tableData,
        startY: 48,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' }
        },
        didDrawPage: (data) => {
          const str = `${doc.getNumberOfPages()}`
          doc.setFontSize(10)
          const pageSize = doc.internal.pageSize
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
          const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth()
          doc.text(str, pageWidth - 15, pageHeight - 10)
        }
      })
    } else if (vistaDetalle === 'judokas') {
      // Vista por judokas
      const clubFiltro = clubSeleccionado === 'todos' 
        ? 'Todos los clubes' 
        : clubes.find(c => c.id === clubSeleccionado)?.nombre_club || ''
      
      const totalCobradoJudokas = resumenesPorJudoka.reduce((sum, r) => sum + r.totalCobrado, 0)
      const totalPendienteJudokas = resumenesPorJudoka.reduce((sum, r) => sum + r.totalPendiente, 0)
      const totalVencidoJudokas = resumenesPorJudoka.reduce((sum, r) => sum + r.totalVencido, 0)
      const totalPagosJudokas = resumenesPorJudoka.reduce((sum, r) => sum + r.cantidadPagos, 0)

      doc.setFontSize(10)
      doc.text(`Club: ${clubFiltro}`, 14, 42)
      doc.text(`Total Cobrado: Bs. ${totalCobradoJudokas.toFixed(2)}`, 14, 48)
      doc.text(`Total Pendiente: Bs. ${totalPendienteJudokas.toFixed(2)}`, 80, 48)
      doc.text(`Total Vencido: Bs. ${totalVencidoJudokas.toFixed(2)}`, 146, 48)
      
      // Tabla de judokas
      const tableData = resumenesPorJudoka.map(r => {
        const nombreClub = clubes.find(c => c.id === r.judoka.club_id)?.nombre_club || ''
        return [
          `${r.judoka.nombres} ${r.judoka.apellidos}`,
          nombreClub,
          r.judoka.ci || '',
          r.cantidadPagos.toString(),
          `Bs. ${r.totalCobrado.toFixed(2)}`,
          `Bs. ${r.totalPendiente.toFixed(2)}`,
          `Bs. ${r.totalVencido.toFixed(2)}`
        ]
      })

      autoTable(doc, {
        head: [['Judoka', 'Club', 'CI', 'Pagos', 'Cobrado', 'Pendiente', 'Vencido']],
        body: tableData,
        foot: [[
          'TOTAL',
          '',
          '',
          totalPagosJudokas.toString(),
          `Bs. ${totalCobradoJudokas.toFixed(2)}`,
          `Bs. ${totalPendienteJudokas.toFixed(2)}`,
          `Bs. ${totalVencidoJudokas.toFixed(2)}`
        ]],
        showFoot: 'lastPage',
        startY: 54,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        footStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 23, halign: 'right' },
          5: { cellWidth: 23, halign: 'right' },
          6: { cellWidth: 23, halign: 'right' }
        },
        didDrawPage: (data) => {
          const str = `${doc.getNumberOfPages()}`
          doc.setFontSize(10)
          const pageSize = doc.internal.pageSize
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
          const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth()
          doc.text(str, pageWidth - 15, pageHeight - 10)
        }
      })
    } else {
      // Vista por pagos
      const clubFiltro = clubSeleccionado === 'todos' 
        ? 'Todos los clubes' 
        : clubes.find(c => c.id === clubSeleccionado)?.nombre_club || ''

      const totalMontoFinalPagos = pagosConDetalles.reduce((sum, p) => sum + p.monto_final, 0)
      const totalCobradoPagos = pagosConDetalles
        .filter(p => p.estado === ESTADO_PAGO.PAGADO)
        .reduce((sum, p) => sum + p.monto_final, 0)
      const totalPendientePagos = pagosConDetalles
        .filter(p => p.estado !== ESTADO_PAGO.PAGADO)
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      doc.setFontSize(10)
      doc.text(`Club: ${clubFiltro}`, 14, 42)
      doc.text(`Total Cobrado: Bs. ${totalCobradoPagos.toFixed(2)}`, 14, 48)
      doc.text(`Total Pendiente: Bs. ${totalPendientePagos.toFixed(2)}`, 80, 48)
      doc.text(`Total General: Bs. ${totalMontoFinalPagos.toFixed(2)}`, 146, 48)
      
      // Tabla de pagos
      const tableData = pagosConDetalles.map(p => [
        formatters.formatDate(p.created_at),
        p.judoka_nombre || 'N/A',
        p.club_nombre || 'N/A',
        p.concepto,
        getTipoLabel(p.tipo_pago),
        `Bs. ${p.monto_final.toFixed(2)}`,
        p.estado,
        p.estado === ESTADO_PAGO.PAGADO && p.fecha_pago
          ? formatters.formatDateTime(p.fecha_pago)
          : formatters.formatDate(p.fecha_vencimiento)
      ])

      autoTable(doc, {
        head: [['Fecha', 'Judoka', 'Club', 'Concepto', 'Tipo', 'Monto', 'Estado', 'Fecha Pago / Venc.']],
        body: tableData,
        foot: [[
          '',
          '',
          '',
          '',
          'TOTAL',
          `Bs. ${totalMontoFinalPagos.toFixed(2)}`,
          '',
          ''
        ]],
        showFoot: 'lastPage',
        startY: 54,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        footStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 22 },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 24 }
        },
        didDrawPage: (data) => {
          const str = `${doc.getNumberOfPages()}`
          doc.setFontSize(10)
          const pageSize = doc.internal.pageSize
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
          const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth()
          doc.text(str, pageWidth - 15, pageHeight - 10)
        }
      })
    }

    const filename = vistaDetalle === 'club' 
      ? `reporte_clubes_${fechaInicio}_${fechaFin}.pdf`
      : vistaDetalle === 'judokas'
      ? `reporte_judokas_${fechaInicio}_${fechaFin}.pdf`
      : `reporte_pagos_${fechaInicio}_${fechaFin}.pdf`
    doc.save(filename)
  }

  const exportarExcel = () => {
    let headers: string[]
    let rows: (string | number)[][]
    let totalesRows: (string | number)[][]

    if (vistaDetalle === 'club') {
      headers = ['Club', 'Judokas', 'Pagos', 'Total Cobrado', 'Total Pendiente', 'Total Vencido']
      rows = resumenesPorClub.map(r => [
        r.club.nombre_club,
        r.cantidadJudokas,
        r.cantidadPagos,
        r.totalCobrado.toFixed(2),
        r.totalPendiente.toFixed(2),
        r.totalVencido.toFixed(2)
      ])

      // Agregar totales
      totalesRows = [
        ['', '', '', '', '', ''],
        ['TOTALES', '', '', totalesGenerales.totalCobrado.toFixed(2), totalesGenerales.totalPendiente.toFixed(2), totalesGenerales.totalVencido.toFixed(2)]
      ]
    } else if (vistaDetalle === 'judokas') {
      headers = ['Judoka', 'Club', 'CI', 'Pagos', 'Total Cobrado', 'Total Pendiente', 'Total Vencido', 'Total General']
      rows = resumenesPorJudoka.map(r => {
        const nombreClub = clubes.find(c => c.id === r.judoka.club_id)?.nombre_club || ''
        return [
          `${r.judoka.nombres} ${r.judoka.apellidos}`,
          nombreClub,
          r.judoka.ci || '',
          r.cantidadPagos,
          r.totalCobrado.toFixed(2),
          r.totalPendiente.toFixed(2),
          r.totalVencido.toFixed(2),
          (r.totalCobrado + r.totalPendiente).toFixed(2)
        ]
      })

      // Calcular totales para judokas
      const totalCobradoJudokas = resumenesPorJudoka.reduce((sum, r) => sum + r.totalCobrado, 0)
      const totalPendienteJudokas = resumenesPorJudoka.reduce((sum, r) => sum + r.totalPendiente, 0)
      const totalVencidoJudokas = resumenesPorJudoka.reduce((sum, r) => sum + r.totalVencido, 0)
      
      totalesRows = [
        ['', '', '', '', '', '', '', ''],
        ['TOTALES', '', '', '', totalCobradoJudokas.toFixed(2), totalPendienteJudokas.toFixed(2), totalVencidoJudokas.toFixed(2), (totalCobradoJudokas + totalPendienteJudokas).toFixed(2)]
      ]
    } else {
      headers = ['Fecha', 'Judoka', 'Club', 'Concepto', 'Tipo', 'Monto Base', 'Descuento', 'Monto Final', 'Estado', 'Fecha Vencimiento', 'Fecha Pago']
      rows = pagosConDetalles.map(p => [
        formatters.formatDate(p.created_at),
        p.judoka_nombre || 'N/A',
        p.club_nombre || 'N/A',
        p.concepto,
        getTipoLabel(p.tipo_pago),
        p.monto_base.toFixed(2),
        'N/A', // Placeholder for discount info if needed
        p.monto_final.toFixed(2),
        p.estado,
        formatters.formatDate(p.fecha_vencimiento),
        p.fecha_pago ? formatters.formatDate(p.fecha_pago) : 'N/A'
      ])

      // Calcular totales para pagos
      const totalMontoBase = pagosConDetalles.reduce((sum, p) => sum + p.monto_base, 0)
      const totalMontoFinal = pagosConDetalles.reduce((sum, p) => sum + p.monto_final, 0)
      
      totalesRows = [
        ['', '', '', '', '', '', '', '', '', '', ''],
        ['TOTALES', '', '', '', '', totalMontoBase.toFixed(2), '', totalMontoFinal.toFixed(2), '', '', '']
      ]
    }

    const allRows = [headers, ...rows, ...totalesRows]
    const csv = allRows.map(row => row.join(',')).join('\n')
    
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const filename = vistaDetalle === 'club' 
      ? `reporte_clubes_${fechaInicio}_${fechaFin}.csv`
      : vistaDetalle === 'judokas'
      ? `reporte_judokas_${fechaInicio}_${fechaFin}.csv`
      : `reporte_pagos_${fechaInicio}_${fechaFin}.csv`
    link.download = filename
    link.click()
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'asociacion']}>
        <Layout>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'asociacion']}>
      <Layout>
        <Box>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                Reportes Consolidados - Asociación
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DownloadIcon />}
                onClick={exportarPDF}
                disabled={resumenesPorClub.length === 0}
                sx={{ minHeight: '44px', textTransform: 'none' }}
              >
                Exportar a PDF
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={exportarExcel}
                disabled={resumenesPorClub.length === 0}
                sx={{ minHeight: '44px', textTransform: 'none' }}
              >
                Exportar a Excel
              </Button>
            </Box>
          </Box>

          {/* Filtros */}
          <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }} variant="outlined">
            <Stack spacing={1.5}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(auto-fit, minmax(155px, 1fr))' },
                gap: 1.5,
                alignItems: 'center'
              }}>
                <DatePicker
                  label="Desde"
                  value={fechaInicio ? dayjs(fechaInicio) : null}
                  onChange={(newValue) => {
                    setFechaInicio(newValue ? newValue.format('YYYY-MM-DD') : '')
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { backgroundColor: 'white' } } }}
                  format="DD/MM/YYYY"
                />
                <DatePicker
                  label="Hasta"
                  value={fechaFin ? dayjs(fechaFin) : null}
                  onChange={(newValue) => {
                    setFechaFin(newValue ? newValue.format('YYYY-MM-DD') : '')
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { backgroundColor: 'white' } } }}
                  format="DD/MM/YYYY"
                />
                <FormControl size="small" fullWidth sx={{ backgroundColor: 'white' }}>
                  <InputLabel>Club</InputLabel>
                  <Select
                    value={clubSeleccionado}
                    label="Club"
                    onChange={(e) => setClubSeleccionado(e.target.value)}
                  >
                    <MenuItem value="todos">Todos los clubes</MenuItem>
                    {[...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club)).map(club => (
                      <MenuItem key={club.id} value={club.id}>
                        {club.nombre_club}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth sx={{ backgroundColor: 'white' }}>
                  <InputLabel>Vista</InputLabel>
                  <Select
                    value={vistaDetalle}
                    label="Vista"
                    onChange={(e) => setVistaDetalle(e.target.value as 'club' | 'pagos' | 'judokas')}
                  >
                    <MenuItem value="club">Por Club</MenuItem>
                    <MenuItem value="judokas">Por Judokas</MenuItem>
                    <MenuItem value="pagos">Detalle de Pagos</MenuItem>
                  </Select>
                </FormControl>
                {(clubSeleccionado !== 'todos' || vistaDetalle !== 'club') && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    color="warning"
                    fullWidth
                    sx={{ backgroundColor: 'white', height: '40px', textTransform: 'none' }}
                  >
                    Limpiar
                  </Button>
                )}
              </Box>
              {(clubSeleccionado !== 'todos' || vistaDetalle !== 'club') && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {clubSeleccionado !== 'todos' && (
                    <Chip
                      label={`Club: ${clubes.find(c => c.id === clubSeleccionado)?.nombre_club ?? clubSeleccionado}`}
                      onDelete={() => setClubSeleccionado('todos')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {vistaDetalle !== 'club' && (
                    <Chip
                      label={`Vista: ${vistaDetalle === 'judokas' ? 'Por Judokas' : 'Detalle de Pagos'}`}
                      onDelete={() => setVistaDetalle('club')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* Totales Generales */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <Card sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '250px', bgcolor: '#66BB6A' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="#000" fontWeight="bold">TOTAL COBRADO</Typography>
                <Typography variant="h4" fontWeight="bold" color="#000">
                  Bs. {totalesGenerales.totalCobrado.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="#000">
                  Todos los clubes
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '250px', bgcolor: '#FFA726' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="#000" fontWeight="bold">TOTAL PENDIENTE</Typography>
                <Typography variant="h4" fontWeight="bold" color="#000">
                  Bs. {totalesGenerales.totalPendiente.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="#000">
                  Por cobrar
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '250px', bgcolor: '#EF5350' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="#000" fontWeight="bold">TOTAL VENCIDO</Typography>
                <Typography variant="h4" fontWeight="bold" color="#000">
                  Bs. {totalesGenerales.totalVencido.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="#000">
                  Morosidad
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '250px', bgcolor: '#42A5F5' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="#000" fontWeight="bold">CLUBES ACTIVOS</Typography>
                <Typography variant="h4" fontWeight="bold" color="#000">
                  {totalesGenerales.clubesActivos} / {totalesGenerales.cantidadClubes}
                </Typography>
                <Typography variant="caption" color="#000">
                  Con actividad en el período
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Tabla Resumen por Club */}
          {vistaDetalle === 'club' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Resumen por Club
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Club</TableCell>
                    <TableCell align="center">Judokas</TableCell>
                    <TableCell align="center">Pagos</TableCell>
                    <TableCell align="right">Total Cobrado</TableCell>
                    <TableCell align="right">Total Pendiente</TableCell>
                    <TableCell align="right">Total Vencido</TableCell>
                    <TableCell align="right">Total General</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumenesPorClub.map((resumen) => (
                    <TableRow key={resumen.club.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {resumen.club.nombre_club}
                        </Typography>
                        {resumen.club.provincia && (
                          <Typography variant="caption" color="text.secondary">
                            {resumen.club.provincia}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">{resumen.cantidadJudokas}</TableCell>
                      <TableCell align="center">{resumen.cantidadPagos}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          Bs. {resumen.totalCobrado.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main" fontWeight="bold">
                          Bs. {resumen.totalPendiente.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main" fontWeight="bold">
                          Bs. {resumen.totalVencido.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          Bs. {(resumen.totalCobrado + resumen.totalPendiente).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {resumenesPorClub.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">
                          No hay datos en el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>          )}

          {/* Tabla Resumen por Judoka */}
          {vistaDetalle === 'judokas' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              {clubSeleccionado === 'todos' 
                ? 'Resumen por Judoka - Todos los Clubes'
                : `Resumen por Judoka - ${clubes.find(c => c.id === clubSeleccionado)?.nombre_club}`
              }
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Judoka</TableCell>
                    <TableCell>Club</TableCell>
                    <TableCell align="center">CI</TableCell>
                    <TableCell align="center">Pagos</TableCell>
                    <TableCell align="right">Total Cobrado</TableCell>
                    <TableCell align="right">Total Pendiente</TableCell>
                    <TableCell align="right">Total Vencido</TableCell>
                    <TableCell align="right">Total General</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumenesPorJudoka.map((resumen) => (
                    <TableRow key={resumen.judoka.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {resumen.judoka.nombres} {resumen.judoka.apellidos}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {clubes.find(c => c.id === resumen.judoka.club_id)?.nombre_club || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {resumen.judoka.ci}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{resumen.cantidadPagos}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          Bs. {resumen.totalCobrado.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main" fontWeight="bold">
                          Bs. {resumen.totalPendiente.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main" fontWeight="bold">
                          Bs. {resumen.totalVencido.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          Bs. {(resumen.totalCobrado + resumen.totalPendiente).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {resumenesPorJudoka.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          No hay judokas con pagos en el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          )}

          {/* Tabla Detalle de Pagos */}
          {vistaDetalle === 'pagos' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              {clubSeleccionado === 'todos' 
                ? 'Detalle de Pagos - Todos los Clubes'
                : `Detalle de Pagos - ${clubes.find(c => c.id === clubSeleccionado)?.nombre_club}`
              }
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Judoka</TableCell>
                    <TableCell>Club</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell>Fecha Pago / Vencimiento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosConDetalles.map((pago) => (
                    <TableRow key={pago.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatters.formatDate(pago.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {pago.judoka_nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {pago.club_nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {pago.concepto}
                        </Typography>
                      </TableCell>
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
                      <TableCell align="center">
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            bgcolor: pago.estado === ESTADO_PAGO.PAGADO ? 'success.light' : 
                                    pago.estado === ESTADO_PAGO.VENCIDO ? 'error.light' : 
                                    pago.estado === ESTADO_PAGO.PENDIENTE ? 'warning.light' : 'grey.300',
                            color: '#000',
                            fontWeight: 'bold'
                          }}
                        >
                          {pago.estado.toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {pago.estado === ESTADO_PAGO.PAGADO && pago.fecha_pago
                            ? <Typography variant="body2" color="success.dark">{formatters.formatDateTime(pago.fecha_pago)}</Typography>
                            : formatters.formatDate(pago.fecha_vencimiento)
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagosConDetalles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          No hay pagos en el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          )}        </Box>
      </Layout>
    </ProtectedRoute>
  )
}
