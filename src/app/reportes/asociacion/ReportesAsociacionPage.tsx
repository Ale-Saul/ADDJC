'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
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
  InputLabel
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import AssessmentIcon from '@mui/icons-material/Assessment'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { pagoController } from '@/controllers/pagoController'
import { clubController } from '@/controllers/clubController'
import { judokaController } from '@/controllers/judokaController'
import { Pago } from '@/models/pago'
import { Club } from '@/models/club'
import { Judoka } from '@/models/judoka'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ResumenClub {
  club: Club
  totalCobrado: number
  totalPendiente: number
  totalVencido: number
  cantidadPagos: number
  cantidadJudokas: number
}

interface ResumenJudoka {
  judoka: Judoka
  totalCobrado: number
  totalPendiente: number
  totalVencido: number
  cantidadPagos: number
}

interface PagoConDetalles extends Pago {
  judoka_nombre?: string
  club_nombre?: string
}

export default function ReportesAsociacionPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    return fecha.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [clubSeleccionado, setClubSeleccionado] = useState<string>('todos')
  const [vistaDetalle, setVistaDetalle] = useState<'club' | 'pagos' | 'judokas'>('club')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar todos los pagos
        const pagosResponse = await pagoController.getAllPagos()
        if (pagosResponse.success && pagosResponse.data) {
          setPagos(pagosResponse.data)
        }

        // Cargar todos los clubes
        const clubesResponse = await clubController.getAllClubes()
        if (clubesResponse.success && clubesResponse.data) {
          setClubes(clubesResponse.data)
        }

        // Cargar todos los judokas
        const judokasResponse = await judokaController.getAllJudokas()
        if (judokasResponse.success && judokasResponse.data) {
          setJudokas(judokasResponse.data)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar pagos por fecha
  const pagosFiltrados = useMemo(() => {
    return pagos.filter(pago => {
      const fechaPago = new Date(pago.created_at)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)
      
      return fechaPago >= inicio && fechaPago <= fin
    })
  }, [pagos, fechaInicio, fechaFin])

  // Calcular resumen por club
  const resumenesPorClub = useMemo(() => {
    // Filtrar clubes según selección
    const clubesFiltrados = clubSeleccionado === 'todos' 
      ? clubes 
      : clubes.filter(c => c.id === clubSeleccionado)

    const resumen: ResumenClub[] = clubesFiltrados.map(club => {
      const pagosClub = pagosFiltrados.filter(p => p.club_id === club.id)
      
      const totalCobrado = pagosClub
        .filter(p => p.estado === 'pagado')
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalPendiente = pagosClub
        .filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalVencido = pagosClub
        .filter(p => p.estado === 'vencido')
        .reduce((sum, p) => sum + p.monto_final, 0)

      // Contar judokas únicos con pagos en este período
      const judokasUnicos = new Set(pagosClub.map(p => p.judoka_id))

      return {
        club,
        totalCobrado,
        totalPendiente,
        totalVencido,
        cantidadPagos: pagosClub.length,
        cantidadJudokas: judokasUnicos.size
      }
    })

    // Ordenar por total cobrado descendente
    return resumen.sort((a, b) => b.totalCobrado - a.totalCobrado)
  }, [clubes, pagosFiltrados, clubSeleccionado])

  // Pagos con detalles de judoka y club
  const pagosConDetalles = useMemo(() => {
    // Filtrar pagos según club seleccionado
    const pagosFiltradosPorClub = clubSeleccionado === 'todos'
      ? pagosFiltrados
      : pagosFiltrados.filter(p => p.club_id === clubSeleccionado)
    
    return pagosFiltradosPorClub.map(pago => {
      const judoka = judokas.find(j => j.id === pago.judoka_id)
      const club = clubes.find(c => c.id === pago.club_id)
      
      return {
        ...pago,
        judoka_nombre: judoka ? `${judoka.nombres} ${judoka.apellidos}` : 'N/A',
        club_nombre: club?.nombre_club || 'N/A'
      } as PagoConDetalles
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [pagosFiltrados, judokas, clubes, clubSeleccionado])

  // Calcular resumen por judoka
  const resumenesPorJudoka = useMemo(() => {
    // Filtrar judokas según selección de club
    const judokasFiltrados = clubSeleccionado === 'todos' 
      ? judokas 
      : judokas.filter(j => j.club_id === clubSeleccionado)

    // Filtrar pagos según selección de club
    const pagosFiltradosPorClub = clubSeleccionado === 'todos'
      ? pagosFiltrados
      : pagosFiltrados.filter(p => p.club_id === clubSeleccionado)

    const resumen: ResumenJudoka[] = judokasFiltrados.map(judoka => {
      const pagosJudoka = pagosFiltradosPorClub.filter(p => p.judoka_id === judoka.id)
      
      const totalCobrado = pagosJudoka
        .filter(p => p.estado === 'pagado')
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalPendiente = pagosJudoka
        .filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
        .reduce((sum, p) => sum + p.monto_final, 0)
      
      const totalVencido = pagosJudoka
        .filter(p => p.estado === 'vencido')
        .reduce((sum, p) => sum + p.monto_final, 0)

      return {
        judoka,
        totalCobrado,
        totalPendiente,
        totalVencido,
        cantidadPagos: pagosJudoka.length
      }
    })

    // Ordenar por total pendiente descendente (mostrar primero los que más deben)
    return resumen.sort((a, b) => b.totalPendiente - a.totalPendiente)
  }, [judokas, pagosFiltrados, clubSeleccionado])

  // Totales generales
  const totalesGenerales = useMemo(() => {
    return {
      totalCobrado: resumenesPorClub.reduce((sum, r) => sum + r.totalCobrado, 0),
      totalPendiente: resumenesPorClub.reduce((sum, r) => sum + r.totalPendiente, 0),
      totalVencido: resumenesPorClub.reduce((sum, r) => sum + r.totalVencido, 0),
      cantidadClubes: clubes.length,
      clubesActivos: resumenesPorClub.filter(r => r.cantidadPagos > 0).length
    }
  }, [resumenesPorClub, clubes])

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
    doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString('es-BO')} - ${new Date(fechaFin).toLocaleDateString('es-BO')}`, 14, 28)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-BO')}`, 14, 34)
    
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
        }
      })
    } else if (vistaDetalle === 'judokas') {
      // Vista por judokas
      const clubFiltro = clubSeleccionado === 'todos' 
        ? 'Todos los clubes' 
        : clubes.find(c => c.id === clubSeleccionado)?.nombre_club || ''
      
      doc.setFontSize(10)
      doc.text(`Club: ${clubFiltro}`, 14, 42)
      
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
        startY: 48,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 23, halign: 'right' },
          5: { cellWidth: 23, halign: 'right' },
          6: { cellWidth: 23, halign: 'right' }
        }
      })
    } else {
      // Vista por pagos
      const clubFiltro = clubSeleccionado === 'todos' 
        ? 'Todos los clubes' 
        : clubes.find(c => c.id === clubSeleccionado)?.nombre_club || ''
      
      doc.setFontSize(10)
      doc.text(`Club: ${clubFiltro}`, 14, 42)
      
      // Tabla de pagos
      const tableData = pagosConDetalles.map(p => [
        new Date(p.created_at).toLocaleDateString('es-BO'),
        p.judoka_nombre || 'N/A',
        p.club_nombre || 'N/A',
        p.concepto,
        p.tipo_pago,
        `Bs. ${p.monto_final.toFixed(2)}`,
        p.estado
      ])

      autoTable(doc, {
        head: [['Fecha', 'Judoka', 'Club', 'Concepto', 'Tipo', 'Monto', 'Estado']],
        body: tableData,
        startY: 48,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 20, halign: 'center' }
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
        new Date(p.created_at).toLocaleDateString('es-BO'),
        p.judoka_nombre || 'N/A',
        p.club_nombre || 'N/A',
        p.concepto,
        p.tipo_pago,
        p.monto_base.toFixed(2),
        p.tiene_descuento ? (p.tipo_descuento === 'porcentaje' ? `${p.descuento_porcentaje}%` : `Bs. ${p.descuento_monto}`) : 'N/A',
        p.monto_final.toFixed(2),
        p.estado,
        new Date(p.fecha_vencimiento).toLocaleDateString('es-BO'),
        p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-BO') : 'N/A'
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
    <ProtectedRoute allowedRoles={['asociacion']}>
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
              >
                Exportar a PDF
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={exportarExcel}
                disabled={resumenesPorClub.length === 0}
              >
                Exportar a Excel
              </Button>
            </Box>
          </Box>

          {/* Filtros */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={2}>Filtros</Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Fecha Inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Club</InputLabel>
                <Select
                  value={clubSeleccionado}
                  label="Club"
                  onChange={(e) => setClubSeleccionado(e.target.value)}
                >
                  <MenuItem value="todos">Todos los clubes</MenuItem>
                  {clubes.map(club => (
                    <MenuItem key={club.id} value={club.id}>
                      {club.nombre_club}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
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
            </Box>
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
                        {resumen.club.municipio && (
                          <Typography variant="caption" color="text.secondary">
                            {resumen.club.municipio}
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
                    <TableCell>Vencimiento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosConDetalles.map((pago) => (
                    <TableRow key={pago.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(pago.created_at).toLocaleDateString('es-BO')}
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
                          {pago.tipo_pago}
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
                            bgcolor: pago.estado === 'pagado' ? 'success.light' : 
                                    pago.estado === 'vencido' ? 'error.light' : 
                                    pago.estado === 'pendiente' ? 'warning.light' : 'grey.300',
                            color: '#000',
                            fontWeight: 'bold'
                          }}
                        >
                          {pago.estado.toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(pago.fecha_vencimiento).toLocaleDateString('es-BO')}
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
