'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
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
  Chip
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
import { useAuth } from '@/contexts/AuthContext'
import { pagoController } from '@/controllers/pagoController'
import { judokaController } from '@/controllers/judokaController'
import { clubController } from '@/controllers/clubController'
import { Pago } from '@/models/pago'
import { Judoka } from '@/models/judoka'
import { Club } from '@/models/club'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'

export default function ReportesPage() {
  const { user } = useAuth()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [judokas, setJudokas] = useState<Judoka[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    return fecha.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [senseiFiltro, setSenseiFiltro] = useState<string>('todos')
  const [clubFiltro, setClubFiltro] = useState<string>('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [clubes, setClubes] = useState<Club[]>([])

  const isAdmin = user?.rol === 'admin'

  // Obtener lista única de senseis de los judokas cargados
  const senseisList = useMemo(() => {
    const names = new Set<string>()
    judokas.forEach(j => {
      if (j.nombre_entrenador) names.add(j.nombre_entrenador)
    })
    return Array.from(names).sort()
  }, [judokas])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar clubes si es admin
        if (isAdmin) {
          const clubesResponse = await clubController.getAllClubes()
          if (clubesResponse.success && clubesResponse.data) {
            setClubes(clubesResponse.data)
          }
        }

        // Cargar pagos
        const pagosResponse = isAdmin 
          ? await pagoController.getAllPagos() 
          : user?.club_id 
            ? await pagoController.getPagosByClub(user.club_id)
            : { success: true, data: [] }

        if (pagosResponse.success && pagosResponse.data) {
          setPagos(pagosResponse.data)
        }

        // Cargar judokas
        const judokasResponse = isAdmin
          ? await judokaController.getAllJudokas(true)
          : user?.club_id
            ? await judokaController.getJudokasByClub(user.club_id)
            : { success: true, data: [] }

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
  }, [user?.club_id, isAdmin])

  // Filtrar pagos según criterios
  const pagosFiltrados = useMemo(() => {
    return pagos.filter(pago => {
      // Filtro por fecha (usando fecha de creación)
      const fechaPago = new Date(pago.created_at)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)
      
      if (fechaPago < inicio || fechaPago > fin) return false

      // Filtro por estado
      if (estadoFiltro !== 'todos' && pago.estado !== estadoFiltro) return false

      // Filtro por tipo
      if (tipoFiltro !== 'todos' && pago.tipo_pago !== tipoFiltro) return false

      // Filtro por Club (Solo Admin)
      if (isAdmin && clubFiltro !== 'todos' && pago.club_id !== clubFiltro) return false

      // Filtro por Sensei
      if (senseiFiltro !== 'todos') {
        const judoka = judokas.find(j => j.id === pago.judoka_id)
        if (judoka?.nombre_entrenador !== senseiFiltro) return false
      }

      return true
    })
  }, [pagos, fechaInicio, fechaFin, estadoFiltro, tipoFiltro, senseiFiltro, clubFiltro, judokas, isAdmin])

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalGenerado = pagosFiltrados
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto_final, 0)

    const totalPendiente = pagosFiltrados
      .filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
      .reduce((sum, p) => sum + p.monto_final, 0)

    const totalVencido = pagosFiltrados
      .filter(p => p.estado === 'vencido')
      .reduce((sum, p) => sum + p.monto_final, 0)

    // Desglose por tipo de pago
    const porTipo = pagosFiltrados.reduce((acc, pago) => {
      const tipo = pago.tipo_pago
      if (!acc[tipo]) {
        acc[tipo] = { total: 0, cantidad: 0, pagado: 0 }
      }
      acc[tipo].total += pago.monto_final
      acc[tipo].cantidad += 1
      if (pago.estado === 'pagado') {
        acc[tipo].pagado += pago.monto_final
      }
      return acc
    }, {} as Record<string, { total: number; cantidad: number; pagado: number }>)

    // Desglose por estado
    const porEstado = pagosFiltrados.reduce((acc, pago) => {
      const estado = pago.estado
      if (!acc[estado]) {
        acc[estado] = { total: 0, cantidad: 0 }
      }
      acc[estado].total += pago.monto_final
      acc[estado].cantidad += 1
      return acc
    }, {} as Record<string, { total: number; cantidad: number }>)

    return {
      totalGenerado,
      totalPendiente,
      totalVencido,
      cantidadTotal: pagosFiltrados.length,
      porTipo,
      porEstado
    }
  }, [pagosFiltrados])

  // Función helper para obtener nombre del judoka
  const getJudokaNombre = (judokaId: string) => {
    const judoka = judokas.find(j => j.id === judokaId)
    if (!judoka) return 'Desconocido'
    return `${judoka.nombres} ${judoka.apellidos}`
  }

  const exportarExcel = () => {
    // Crear CSV
    const headers = ['Fecha Creación', 'Judoka', 'Concepto', 'Tipo', 'Monto Base', 'Descuento', 'Monto Final', 'Estado', 'Fecha Vencimiento', 'Fecha Pago']
    const rows = pagosFiltrados.map(p => [
      formatters.formatDate(p.created_at),
      getJudokaNombre(p.judoka_id),
      p.concepto,
      p.tipo_pago,
      p.monto_base.toFixed(2),
      p.tiene_descuento ? (p.tipo_descuento === 'porcentaje' ? `${p.descuento_porcentaje}%` : `Bs. ${p.descuento_monto}`) : '-',
      p.monto_final.toFixed(2),
      p.estado,
      formatters.formatDate(p.fecha_vencimiento),
      p.fecha_pago ? formatters.formatDate(p.fecha_pago) : '-'
    ])

    // Calcular totales
    const totalCobrado = pagosFiltrados
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto_final, 0)
    
    const totalPendiente = pagosFiltrados
      .filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
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
    doc.text(`Fecha de generación: ${formatters.formatDate(new Date())}`, 14, 34)
    
    // Totales
    const totalCobrado = pagosFiltrados
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto_final, 0)
    
    const totalPendiente = pagosFiltrados
      .filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
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
      }
    })

    // Guardar PDF
    doc.save(`reporte_pagos_${fechaInicio}_${fechaFin}.pdf`)
  }

  const getEstadoChip = (estado: string) => {
    const colores: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
      pagado: 'success',
      pendiente: 'warning',
      vencido: 'error',
      parcial: 'info',
      cancelado: 'default'
    }
    return <Chip label={estado} color={colores[estado] || 'default'} size="small" />
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      cuota_mensual: 'Cuota Mensual',
      cuota_traje: 'Cuota Traje',
      inscripcion: 'Inscripción',
      examen_grado: 'Examen de Grado',
      evento: 'Evento',
      otro: 'Otro'
    }
    return labels[tipo] || tipo
  }

  const clearFilters = () => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    setFechaInicio(fecha.toISOString().split('T')[0])
    setFechaFin(new Date().toISOString().split('T')[0])
    setEstadoFiltro('todos')
    setTipoFiltro('todos')
    setSenseiFiltro('todos')
    setClubFiltro('todos')
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
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="pagado">Pagado</MenuItem>
                      <MenuItem value="vencido">Vencido</MenuItem>
                      <MenuItem value="parcial">Parcial</MenuItem>
                      <MenuItem value="cancelado">Cancelado</MenuItem>
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
                      {[
                        { val: 'cuota_mensual', label: 'Cuota Mensual' },
                        { val: 'cuota_traje', label: 'Cuota Traje' },
                        { val: 'inscripcion', label: 'Inscripción' },
                        { val: 'examen_grado', label: 'Examen de Grado' },
                        { val: 'evento', label: 'Evento' },
                        { val: 'otro', label: 'Otro' }
                      ].sort((a, b) => a.label.localeCompare(b.label)).map(tipo => (
                        <MenuItem key={tipo.val} value={tipo.val}>{tipo.label}</MenuItem>
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
                  {pagosFiltrados.filter(p => p.estado === 'pagado').length} pagos cobrados
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
                  {pagosFiltrados.filter(p => p.estado === 'pendiente' || p.estado === 'vencido').length} pagos pendientes
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
                  {pagosFiltrados.filter(p => p.estado === 'vencido').length} pagos vencidos
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
                    const judoka = judokas.find(j => j.id === pago.judoka_id)
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
                              {judoka?.nombre_club || '-'}
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
