'use client'

import { useState, useMemo } from 'react'
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/es'
import dayjs from 'dayjs'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DownloadIcon from '@mui/icons-material/Download'
import ClearIcon from '@mui/icons-material/Clear'
import BalanceCards from '@/components/contabilidad/BalanceCards'
import MovimientosTable from '@/components/contabilidad/MovimientosTable'
import { MovimientoFormDialog } from '@/components/contabilidad/MovimientoFormDialog'
import Pagination from '@/components/common/Pagination'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'
import { useContabilidad } from '@/hooks/useContabilidad'
import { useAuth } from '@/contexts/AuthContext'
import { TIPO_MOVIMIENTO, CATEGORIA_MOVIMIENTO_LABELS, ESTADO_MOVIMIENTO } from '@/constants/contabilidad'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'
import * as movimientoFinancieroService from '@/services/movimientoFinancieroService'
import { useEffect } from 'react'

interface IngresosEgresosTabProps {
  clubId?: string
  isAdmin?: boolean
}

export default function IngresosEgresosTab({ clubId, isAdmin }: IngresosEgresosTabProps) {
  const { user } = useAuth()
  const [selectedClubId, setSelectedClubId] = useState<string>(clubId || '')
  const [dialogTipo, setDialogTipo] = useState<'ingreso' | 'egreso'>('ingreso')

  const effectiveClubId = isAdmin ? (selectedClubId || undefined) : (clubId || undefined)

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
  } = useContabilidad({ clubId: effectiveClubId })

  // Sincronizar cuotas pagadas que aún no tengan movimiento financiero
  useEffect(() => {
    movimientoFinancieroService.sincronizarPagosExistentes()
      .then(() => cargarDatos())
      .catch((err) => console.error('Error al sincronizar pagos existentes:', err))
  }, [])

  const clubActualNombre = useMemo(() => {
    if (!effectiveClubId) return 'General / Todos los Clubes'
    const encontrado = clubes.find(c => c.id === effectiveClubId)
    return encontrado?.nombre_club || 'Club'
  }, [clubes, effectiveClubId])

  const abrirNuevoIngreso = () => {
    setDialogTipo('ingreso')
    handleAgregarMovimiento()
  }

  const abrirNuevoEgreso = () => {
    setDialogTipo('egreso')
    handleAgregarMovimiento()
  }

  const exportarPDF = () => {
    const doc = new jsPDF()

    // Encabezado
    doc.setFontSize(18)
    doc.text(`Reporte de Finanzas - ${clubActualNombre}`, 14, 20)

    doc.setFontSize(10)
    doc.text(`Período: ${formatters.formatDate(fechaInicio)} al ${formatters.formatDate(fechaFin)}`, 14, 28)
    doc.text(`Fecha de emisión: ${formatters.formatDateTime(new Date(), true)}`, 14, 34)
    doc.text(`Generado por: ${user ? `${user.nombres} ${user.apellidos}` : 'Usuario'}`, 14, 40)

    // Resumen numérico
    const totalIngresos = movimientosFiltrados
      .filter(m => m.tipo === TIPO_MOVIMIENTO.INGRESO && m.estado !== ESTADO_MOVIMIENTO.ANULADO)
      .reduce((sum, m) => sum + m.monto, 0)
    const totalEgresos = movimientosFiltrados
      .filter(m => m.tipo === TIPO_MOVIMIENTO.EGRESO && m.estado !== ESTADO_MOVIMIENTO.ANULADO)
      .reduce((sum, m) => sum + m.monto, 0)

    doc.setFont('helvetica', 'bold')
    doc.text(`Ingresos: Bs. ${totalIngresos.toFixed(2)}`, 14, 48)
    doc.text(`Egresos: Bs. ${totalEgresos.toFixed(2)}`, 80, 48)
    doc.text(`Balance Neto: Bs. ${(totalIngresos - totalEgresos).toFixed(2)}`, 146, 48)

    const tableData = movimientosFiltrados.map(mov => [
      formatters.formatDateTime(mov.created_at),
      mov.tipo === TIPO_MOVIMIENTO.INGRESO ? 'Ingreso' : 'Egreso',
      movimientoFinancieroController.getCategoriaLabel(mov.categoria),
      mov.concepto,
      mov.origen_club_nombre || mov.origen_entidad || '-',
      `Bs. ${mov.monto.toFixed(2)}`,
      mov.estado,
    ])

    autoTable(doc, {
      head: [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Club / Origen', 'Monto', 'Estado']],
      body: tableData,
      foot: [[
        '',
        '',
        '',
        '',
        'BALANCE',
        `Bs. ${(totalIngresos - totalEgresos).toFixed(2)}`,
        '',
      ]],
      showFoot: 'lastPage',
      startY: 55,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [46, 125, 50], textColor: 255 },
      footStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    })

    doc.save(`caja_${fechaInicio}_${fechaFin}.pdf`)
  }

  const exportarExcel = () => {
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Descripción', 'Monto', 'Club / Origen', 'Estado']
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
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `caja_${fechaInicio}_${fechaFin}.csv`
    link.click()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box>
        {/* Acciones principales del módulo de caja */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2, 
            mb: 3 
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Caja del Club ({clubActualNombre})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registra y controla ingresos y egresos ordinarios y extraordinarios
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={abrirNuevoIngreso}
              sx={{ fontWeight: 'bold', textTransform: 'none', minHeight: '42px', px: 2.5 }}
            >
              Nuevo Ingreso
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<RemoveIcon />}
              onClick={abrirNuevoEgreso}
              sx={{ fontWeight: 'bold', textTransform: 'none', minHeight: '42px', px: 2.5 }}
            >
              Nuevo Egreso
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<DownloadIcon />}
              onClick={exportarPDF}
              disabled={movimientosFiltrados.length === 0}
              sx={{ textTransform: 'none', minHeight: '42px' }}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<DownloadIcon />}
              onClick={exportarExcel}
              disabled={movimientosFiltrados.length === 0}
              sx={{ textTransform: 'none', minHeight: '42px' }}
            >
              Excel
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && movimientos.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Tarjetas de Resumen Financiero */}
            <BalanceCards balance={balance} loading={loading} />

            {/* Barra de Filtros */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }} variant="outlined">
              <Stack spacing={2}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(auto-fit, minmax(170px, 1fr))' },
                  gap: 1.5,
                  alignItems: 'center'
                }}>
                  <DatePicker
                    label="Desde"
                    value={fechaInicio ? dayjs(fechaInicio) : null}
                    onChange={(newValue) => setFechaInicio(newValue ? newValue.format('YYYY-MM-DD') : '')}
                    slotProps={{ textField: { size: 'small', fullWidth: true, sx: { backgroundColor: 'white' } } }}
                    format="DD/MM/YYYY"
                  />
                  <DatePicker
                    label="Hasta"
                    value={fechaFin ? dayjs(fechaFin) : null}
                    onChange={(newValue) => setFechaFin(newValue ? newValue.format('YYYY-MM-DD') : '')}
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
                      <MenuItem value="todos">Todos los tipos</MenuItem>
                      <MenuItem value={TIPO_MOVIMIENTO.INGRESO}>Solo Ingresos</MenuItem>
                      <MenuItem value={TIPO_MOVIMIENTO.EGRESO}>Solo Egresos</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth sx={{ backgroundColor: 'white' }}>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={categoriaFiltro}
                      label="Categoría"
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todas las categorías</MenuItem>
                      {Object.entries(CATEGORIA_MOVIMIENTO_LABELS).sort((a, b) => a[1].localeCompare(b[1])).map(([val, label]) => (
                        <MenuItem key={val} value={val}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {isAdmin && (
                    <FormControl size="small" fullWidth sx={{ backgroundColor: 'white' }}>
                      <InputLabel>Club</InputLabel>
                      <Select
                        value={selectedClubId}
                        label="Club"
                        onChange={(e) => setSelectedClubId(e.target.value)}
                      >
                        <MenuItem value="">Todos los clubes</MenuItem>
                        {clubes.map(c => (
                          <MenuItem key={c.id} value={c.id}>{c.nombre_club}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {(tipoFiltro !== 'todos' || categoriaFiltro !== 'todos' || (isAdmin && selectedClubId !== '')) && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={() => {
                        clearFilters()
                        if (isAdmin) setSelectedClubId('')
                      }}
                      color="warning"
                      sx={{ backgroundColor: 'white', height: '40px', textTransform: 'none' }}
                    >
                      Limpiar
                    </Button>
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Tabla de Movimientos */}
            <MovimientosTable
              movimientos={paginatedData}
              onEditar={handleEditarMovimiento}
              onAnular={handleAnularMovimiento}
              currentPage={page}
              itemsPerPage={itemsPerPage}
            />

            {totalPages > 1 && (
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
            )}
          </>
        )}

        {/* Diálogo Formulario Nuevo / Editar Movimiento */}
        <MovimientoFormDialog
          open={openDialog}
          movimiento={editingMovimiento}
          defaultClubId={effectiveClubId}
          initialTipo={dialogTipo}
          onClose={() => setOpenDialog(false)}
          onSave={handleGuardarMovimiento}
        />
      </Box>
    </LocalizationProvider>
  )
}

