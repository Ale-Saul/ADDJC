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
  CircularProgress,
  Alert,
  Collapse,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import FilterListIcon from '@mui/icons-material/FilterList'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ClearIcon from '@mui/icons-material/Clear'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import BalanceCards from '@/components/contabilidad/BalanceCards'
import MovimientosTable from '@/components/contabilidad/MovimientosTable'
import MovimientoFormDialog from '@/components/contabilidad/MovimientoFormDialog'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'
import { useContabilidad } from '@/hooks/useContabilidad'
import { TIPO_MOVIMIENTO, CATEGORIA_MOVIMIENTO, TIPO_MOVIMIENTO_LABELS, CATEGORIA_MOVIMIENTO_LABELS } from '@/constants/contabilidad'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'

export default function ContabilidadPage() {
  const { user } = useAuth()
  const {
    movimientos,
    clubes,
    loading,
    error,
    openDialog,
    setOpenDialog,
    editingMovimiento,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    tipoFiltro,
    setTipoFiltro,
    categoriaFiltro,
    setCategoriaFiltro,
    clubFiltro,
    setClubFiltro,
    showFilters,
    setShowFilters,
    clearFilters,
    cargarDatos,
    movimientosFiltrados,
    balance,
    handleAgregarMovimiento,
    handleEditarMovimiento,
    handleEliminarMovimiento,
    handleAnularMovimiento,
    handleGuardarMovimiento
  } = useContabilidad()

  const exportarPDF = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(18)
    doc.text('Reporte de Contabilidad', 14, 22)
    
    // Período
    doc.setFontSize(12)
    doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 14, 32)
    
    // Balance
    doc.setFontSize(14)
    doc.text(`Total Ingresos: Bs. ${balance.total_ingresos.toFixed(2)}`, 14, 42)
    doc.text(`Total Egresos: Bs. ${balance.total_egresos.toFixed(2)}`, 14, 50)
    doc.text(`Balance: Bs. ${balance.balance.toFixed(2)}`, 14, 58)
    
    // Tabla de movimientos
    const tableData = movimientosFiltrados.map(mov => [
      formatters.formatDate(mov.fecha),
      mov.tipo === TIPO_MOVIMIENTO.INGRESO ? 'Ingreso' : 'Egreso',
      movimientoFinancieroController.getCategoriaLabel(mov.categoria),
      mov.concepto,
      `Bs. ${mov.monto.toFixed(2)}`,
      mov.origen_club_nombre || mov.origen_entidad || '-',
    ])
    
    autoTable(doc, {
      startY: 68,
      head: [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto', 'Origen']],
      body: tableData,
    })
    
    doc.save(`contabilidad_${fechaInicio}_${fechaFin}.pdf`)
  }

  const exportarExcel = () => {
    // Crear CSV
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Descripción', 'Monto', 'Origen', 'Estado']
    const rows = movimientosFiltrados.map(mov => [
      mov.fecha,
      mov.tipo,
      mov.categoria,
      mov.concepto,
      mov.descripcion || '',
      mov.monto,
      mov.origen_club_nombre || mov.origen_entidad || '',
      mov.estado,
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contabilidad_${fechaInicio}_${fechaFin}.csv`
    link.click()
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'asociacion']}>
      <Layout>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                Contabilidad de la Asociación
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={cargarDatos}
                disabled={loading}
              >
                Actualizar
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportarPDF}
                disabled={movimientosFiltrados.length === 0}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportarExcel}
                disabled={movimientosFiltrados.length === 0}
              >
                Excel
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Balance Cards */}
              <BalanceCards balance={balance} loading={loading} />

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

                      {(tipoFiltro !== 'todos' || categoriaFiltro !== 'todos' || clubFiltro !== 'todos') && (
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
                      <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'white' }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={tipoFiltro}
                          label="Tipo"
                          onChange={(e) => setTipoFiltro(e.target.value)}
                        >
                          <MenuItem value="todos">Todos</MenuItem>
                          <MenuItem value={TIPO_MOVIMIENTO.INGRESO}>Ingresos</MenuItem>
                          <MenuItem value={TIPO_MOVIMIENTO.EGRESO}>Egresos</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={categoriaFiltro}
                          label="Categoría"
                          onChange={(e) => setCategoriaFiltro(e.target.value)}
                        >
                          <MenuItem value="todos">Todas</MenuItem>
                          {Object.entries(CATEGORIA_MOVIMIENTO_LABELS).sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
                        <InputLabel>Club</InputLabel>
                        <Select
                          value={clubFiltro}
                          label="Club"
                          onChange={(e) => setClubFiltro(e.target.value)}
                        >
                      <MenuItem value="todos">Todos</MenuItem>
                      {[...clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club)).map(club => (
                        <MenuItem key={club.id} value={club.id}>
                          {club.nombre_club}
                        </MenuItem>
                      ))}
                    </Select>
                      </FormControl>
                    </Stack>
                  </Collapse>
                </Stack>
              </Paper>

              {/* Tabla de Movimientos */}
              <MovimientosTable
                movimientos={movimientosFiltrados}
                onEditar={handleEditarMovimiento}
                onEliminar={handleEliminarMovimiento}
                onAnular={handleAnularMovimiento}
                onAgregar={handleAgregarMovimiento}
              />
            </>
          )}

          {/* Diálogo de formulario */}
          <MovimientoFormDialog
            open={openDialog}
            movimiento={editingMovimiento}
            clubes={clubes}
            onClose={() => setOpenDialog(false)}
            onSave={handleGuardarMovimiento}
          />
        </Box>
      </Layout>
    </ProtectedRoute>
  )
}
