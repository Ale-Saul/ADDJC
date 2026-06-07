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
  Stack,
  Chip
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import DownloadIcon from '@mui/icons-material/Download'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ClearIcon from '@mui/icons-material/Clear'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ROL } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import BalanceCards from '@/components/contabilidad/BalanceCards'
import MovimientosTable from '@/components/contabilidad/MovimientosTable'
import { MovimientoFormDialog } from '@/components/contabilidad/MovimientoFormDialog'
import Pagination from '@/components/common/Pagination'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'
import { useContabilidad } from '@/hooks/useContabilidad'
import { TIPO_MOVIMIENTO, CATEGORIA_MOVIMIENTO_LABELS, ESTADO_MOVIMIENTO } from '@/constants/contabilidad'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'

export default function ContabilidadPage() {
  const { user } = useAuth()
  const isEncargado = user?.rol === 'encargado'
  const isAdmin = user?.rol === 'admin'
  const isAsociacion = user?.rol === 'asociacion'
  
  // Solo admin y asociacion pueden editar/anular/agregar
  const canManage = isAdmin || isAsociacion
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
    clearFilters,
    cargarDatos,
    movimientosFiltrados,
    balance,
    handleAgregarMovimiento,
    handleEditarMovimiento,
    handleAnularMovimiento,
    handleGuardarMovimiento,
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedData
  } = useContabilidad()

  const exportarPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text('Reporte de Finanzas - Asociación de Judo', 14, 20)

    // Información general
    doc.setFontSize(11)
    doc.text(`Período: ${formatters.formatDate(fechaInicio)} - ${formatters.formatDate(fechaFin)}`, 14, 28)
    doc.text(`Fecha de generación: ${formatters.formatDateTime(new Date(), true)}`, 14, 34)
    doc.setFontSize(9)
    doc.text(`Generado por: ${user ? `${user.nombres} ${user.apellidos}` : 'Usuario desconocido'}`, 14, 40)
    doc.setFontSize(11)

    // Tabla de movimientos
    const tableData = movimientosFiltrados.map(mov => {
      const origen =
        (mov.categoria === 'donacion_club' || mov.categoria === 'pago_club')
          ? (mov.origen_club_nombre || '-')
          : (mov.categoria === 'aporte_estado' || mov.categoria === 'sponsor')
          ? (mov.origen_entidad || '-')
          : '-'
      return [
        formatters.formatDateTime(mov.created_at),
        mov.tipo === TIPO_MOVIMIENTO.INGRESO ? 'Ingreso' : 'Egreso',
        movimientoFinancieroController.getCategoriaLabel(mov.categoria),
        mov.concepto,
        origen,
        `Bs. ${mov.monto.toFixed(2)}`,
        mov.estado,
      ]
    })

    const totalIngresos = movimientosFiltrados
      .filter(m => m.tipo === TIPO_MOVIMIENTO.INGRESO && m.estado !== ESTADO_MOVIMIENTO.ANULADO)
      .reduce((sum, m) => sum + m.monto, 0)
    const totalEgresos = movimientosFiltrados
      .filter(m => m.tipo === TIPO_MOVIMIENTO.EGRESO && m.estado !== ESTADO_MOVIMIENTO.ANULADO)
      .reduce((sum, m) => sum + m.monto, 0)

    // Resumen financiero en el PDF
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Ingresos: Bs. ${totalIngresos.toFixed(2)}`, 14, 48)
    doc.text(`Total Egresos: Bs. ${totalEgresos.toFixed(2)}`, 80, 48)
    doc.text(`Balance: Bs. ${(totalIngresos - totalEgresos).toFixed(2)}`, 146, 48)

    autoTable(doc, {
      head: [['Fecha/Hora', 'Tipo', 'Categoría', 'Concepto', 'Origen', 'Monto', 'Estado']],
      body: tableData,
      foot: [[
        '',
        '',
        '',
        '',
        'TOTALES',
        `Bs. ${(totalIngresos - totalEgresos).toFixed(2)}`,
        '',
      ]],
      showFoot: 'lastPage',
      startY: 58, // Ajustado para dar espacio
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      footStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30 },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 18, halign: 'center' },
      },
      didDrawPage: () => {
        const str = `${doc.getNumberOfPages()}`
        doc.setFontSize(10)
        const pageSize = doc.internal.pageSize
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth()
        doc.text(str, pageWidth - 15, pageHeight - 10)
      }
    })

    doc.save(`finanzas_${fechaInicio}_${fechaFin}.pdf`)
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
    
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `finanzas_${fechaInicio}_${fechaFin}.csv`
    link.click()
  }

  return (
    <ProtectedRoute allowedRoles={[ROL.ADMIN, ROL.ASOCIACION, ROL.ENCARGADO]}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' }, 
            gap: 2,
            mb: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                Finanzas de la Asociación
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DownloadIcon />}
                onClick={exportarPDF}
                disabled={movimientosFiltrados.length === 0}
                sx={{ minHeight: '44px', textTransform: 'none', flex: { xs: 1, md: 'none' } }}
              >
                Exportar a PDF
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={exportarExcel}
                disabled={movimientosFiltrados.length === 0}
                sx={{ minHeight: '44px', textTransform: 'none', flex: { xs: 1, md: 'none' } }}
              >
                Exportar a Excel
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
                    <FormControl size="small" fullWidth sx={{ backgroundColor: 'white' }}>
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
                    {(tipoFiltro !== 'todos' || categoriaFiltro !== 'todos') && (
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
                  {(tipoFiltro !== 'todos' || categoriaFiltro !== 'todos') && (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {tipoFiltro !== 'todos' && (
                        <Chip
                          label={`Tipo: ${tipoFiltro === TIPO_MOVIMIENTO.INGRESO ? 'Ingresos' : 'Egresos'}`}
                          onDelete={() => setTipoFiltro('todos')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {categoriaFiltro !== 'todos' && (
                        <Chip
                          label={`Categoría: ${CATEGORIA_MOVIMIENTO_LABELS[categoriaFiltro as keyof typeof CATEGORIA_MOVIMIENTO_LABELS] ?? categoriaFiltro}`}
                          onDelete={() => setCategoriaFiltro('todos')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {/* Tabla de Movimientos */}
              <MovimientosTable
                movimientos={paginatedData}
                onEditar={canManage ? handleEditarMovimiento : undefined}
                onAnular={canManage ? handleAnularMovimiento : undefined}
                onAgregar={canManage ? handleAgregarMovimiento : undefined}
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={movimientosFiltrados.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </Box>
            </>
          )}

          {/* Diálogo de formulario */}
          <MovimientoFormDialog
            open={openDialog}
            movimiento={editingMovimiento}
            onClose={() => setOpenDialog(false)}
            onSave={handleGuardarMovimiento}
          />
        </Box>
    </ProtectedRoute>
  )
}
