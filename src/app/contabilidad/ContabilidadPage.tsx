'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Fab,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import * as movimientoFinancieroController from '@/controllers/movimientoFinancieroController'
import { clubController } from '@/controllers/clubController'
import { MovimientoFinanciero, TipoMovimiento, CategoriaMovimiento } from '@/models/movimientoFinanciero'
import { Club } from '@/models/club'
import BalanceCards from '@/components/contabilidad/BalanceCards'
import MovimientosTable from '@/components/contabilidad/MovimientosTable'
import MovimientoFormDialog from '@/components/contabilidad/MovimientoFormDialog'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ContabilidadPage() {
  const { user } = useAuth()
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para diálogo de formulario
  const [openDialog, setOpenDialog] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoFinanciero | null>(null)
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - 1)
    return fecha.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')
  const [clubFiltro, setClubFiltro] = useState<string>('todos')

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar movimientos filtrados por fecha
      const movimientosData = await movimientoFinancieroController.getMovimientosByDateRange(
        fechaInicio,
        fechaFin
      )
      setMovimientos(movimientosData)

      // Cargar clubes para el filtro
      const clubesResponse = await clubController.getAllClubes()
      if (clubesResponse.success && clubesResponse.data) {
        setClubes(clubesResponse.data)
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err)
      setError(err.message || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [fechaInicio, fechaFin])

  // Filtrar movimientos
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(mov => {
      // Filtro por tipo
      if (tipoFiltro !== 'todos' && mov.tipo !== tipoFiltro) return false
      
      // Filtro por categoría
      if (categoriaFiltro !== 'todos' && mov.categoria !== categoriaFiltro) return false
      
      // Filtro por club
      if (clubFiltro !== 'todos' && mov.origen_club_id !== clubFiltro) return false
      
      // Excluir movimientos anulados por defecto
      if (mov.estado === 'anulado') return false
      
      return true
    })
  }, [movimientos, tipoFiltro, categoriaFiltro, clubFiltro])

  // Calcular balance
  const balance = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.monto, 0)
    
    const egresos = movimientosFiltrados
      .filter(m => m.tipo === 'egreso')
      .reduce((sum, m) => sum + m.monto, 0)
    
    return {
      total_ingresos: ingresos,
      total_egresos: egresos,
      balance: ingresos - egresos,
      periodo_inicio: fechaInicio,
      periodo_fin: fechaFin,
    }
  }, [movimientosFiltrados, fechaInicio, fechaFin])

  const handleAgregarMovimiento = () => {
    setEditingMovimiento(null)
    setOpenDialog(true)
  }

  const handleEditarMovimiento = (movimiento: MovimientoFinanciero) => {
    setEditingMovimiento(movimiento)
    setOpenDialog(true)
  }

  const handleEliminarMovimiento = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este movimiento?')) return
    
    try {
      await movimientoFinancieroController.deleteMovimiento(id)
      await cargarDatos()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar movimiento')
    }
  }

  const handleAnularMovimiento = async (id: string) => {
    if (!confirm('¿Está seguro de anular este movimiento?')) return
    
    try {
      await movimientoFinancieroController.anularMovimiento(id)
      await cargarDatos()
    } catch (err: any) {
      alert(err.message || 'Error al anular movimiento')
    }
  }

  const handleGuardarMovimiento = async () => {
    setOpenDialog(false)
    await cargarDatos()
  }

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
      new Date(mov.fecha).toLocaleDateString(),
      mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
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
    <ProtectedRoute allowedRoles={['asociacion']}>
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
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Filtros
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2,
                  '& > *': {
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' },
                    minWidth: { xs: '100%', sm: '200px', md: '150px' }
                  }
                }}>
                  <TextField
                    label="Fecha Inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <TextField
                    label="Fecha Fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <FormControl size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={tipoFiltro}
                      label="Tipo"
                      onChange={(e) => setTipoFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="ingreso">Ingresos</MenuItem>
                      <MenuItem value="egreso">Egresos</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={categoriaFiltro}
                      label="Categoría"
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todas</MenuItem>
                      <MenuItem value="donacion_club">Donación de Club</MenuItem>
                      <MenuItem value="pago_club">Pago de Club</MenuItem>
                      <MenuItem value="aporte_estado">Aporte del Estado</MenuItem>
                      <MenuItem value="sponsor">Patrocinio</MenuItem>
                      <MenuItem value="evento">Evento</MenuItem>
                      <MenuItem value="gasto_operativo">Gasto Operativo</MenuItem>
                      <MenuItem value="pago_proveedor">Pago a Proveedor</MenuItem>
                      <MenuItem value="otro">Otro</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>Club</InputLabel>
                    <Select
                      value={clubFiltro}
                      label="Club"
                      onChange={(e) => setClubFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      {clubes.map(club => (
                        <MenuItem key={club.id} value={club.id}>
                          {club.nombre_club}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Paper>

              {/* Tabla de Movimientos */}
              <MovimientosTable
                movimientos={movimientosFiltrados}
                onEditar={handleEditarMovimiento}
                onEliminar={handleEliminarMovimiento}
                onAnular={handleAnularMovimiento}
              />
            </>
          )}

          {/* FAB para agregar movimiento */}
          <Fab
            color="primary"
            aria-label="agregar movimiento"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={handleAgregarMovimiento}
          >
            <AddIcon />
          </Fab>

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
