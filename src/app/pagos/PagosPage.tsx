'use client'

import {
  Box,
  Typography,
  Paper,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import HistoryIcon from '@mui/icons-material/History'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ClearIcon from '@mui/icons-material/Clear'
import Layout from '@/components/common/Layout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Judoka } from '@/models/judoka'
import PagoForm from '@/components/forms/PagoForm'
import PagosList from '@/components/pagos/PagosList'
import HistorialPagos from '@/components/pagos/HistorialPagos'
import PagoMasivoForm from '@/components/pagos/PagoMasivoForm'
import PagosStats from '@/components/pagos/PagosStats'
import { useJudokas } from '@/hooks/useJudokas'
import { usePagos } from '@/hooks/usePagos'
import { useDialog } from '@/hooks/useDialog'
import { CATEGORIES } from '@/utils/constants'
import { useState, useMemo } from 'react'

export default function PagosPage() {
  const { user } = useAuth()
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false)
  const [senseiFilter, setSenseiFilter] = useState<string>('all')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  
  // Hooks personalizados
  const {
    judokas: rawJudokas,
    isLoading: loadingJudokas,
    searchTerm,
    setSearchTerm,
  } = useJudokas({ clubId: user?.club_id || undefined, autoFetch: true })

  // Obtener lista única de senseis de los judokas cargados
  const senseisList = useMemo(() => {
    const names = new Set<string>()
    rawJudokas.forEach(j => {
      if (j.nombre_entrenador) names.add(j.nombre_entrenador)
    })
    return Array.from(names).sort()
  }, [rawJudokas])

  // Aplicar filtros adicionales y ordenar
  const judokas = useMemo(() => {
    let filtered = [...rawJudokas]
    
    if (senseiFilter !== 'all') {
      filtered = filtered.filter(j => j.nombre_entrenador === senseiFilter)
    }
    
    if (categoriaFilter !== 'all') {
      filtered = filtered.filter(j => j.categoria === categoriaFilter)
    }

    return filtered.sort((a, b) => {
      const nameA = a.nombre_entrenador || 'Z'
      const nameB = b.nombre_entrenador || 'Z'
      return nameA.localeCompare(nameB)
    })
  }, [rawJudokas, senseiFilter, categoriaFilter])

  const clearFilters = () => {
    setSenseiFilter('all')
    setCategoriaFilter('all')
    setSearchTerm('')
  }

  const {
    allPagos: pagos,
    refresh: refreshPagos,
  } = usePagos({ clubId: user?.club_id || undefined })

  // Diálogos
  const pagoDialog = useDialog()
  const pagosListDialog = useDialog()
  const historialDialog = useDialog()
  const masivoDialog = useDialog()

  const handleNuevoPago = (judoka: Judoka) => {
    pagoDialog.open(judoka)
  }

  const handlePagoSuccess = () => {
    pagoDialog.close()
    refreshPagos()
  }

  const handlePagoMasivoSuccess = () => {
    masivoDialog.close()
    refreshPagos()
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'encargado']}>
      <Layout>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Gestión de Pagos y Cuotas
            </Typography>
          </Box>

          {loadingJudokas ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : judokas.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay judokas registrados
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Mini Dashboard de Estadísticas */}
              <PagosStats pagos={pagos} />

              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }} variant="outlined">
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar judoka por nombre o apellido..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{ flexGrow: 1, backgroundColor: 'white' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        )
                      }}
                    />
                    
                    <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FilterListIcon />}
                        endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                        color={showFilters ? 'primary' : 'inherit'}
                        sx={{ 
                          flexGrow: { xs: 1, md: 0 },
                          backgroundColor: 'white',
                          height: '40px',
                          textTransform: 'none',
                          borderColor: showFilters ? 'primary.main' : 'rgba(0, 0, 0, 0.23)'
                        }}
                      >
                        Filtros
                      </Button>

                      {(senseiFilter !== 'all' || categoriaFilter !== 'all' || searchTerm !== '') && (
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
                      <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white', flexGrow: { xs: 1, md: 0 } }}>
                        <InputLabel>Sensei</InputLabel>
                        <Select
                          value={senseiFilter}
                          label="Sensei"
                          onChange={(e) => setSenseiFilter(e.target.value)}
                        >
                          <MenuItem value="all">Todos los senseis</MenuItem>
                          {senseisList.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white', flexGrow: { xs: 1, md: 0 } }}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={categoriaFilter}
                          label="Categoría"
                          onChange={(e) => setCategoriaFilter(e.target.value)}
                        >
                          <MenuItem value="all">Todas las categorías</MenuItem>
                          {CATEGORIES.map(cat => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Collapse>
                </Stack>
              </Paper>

              {judokas.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No se encontraron judokas con los filtros aplicados
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Lista de Judokas
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<GroupAddIcon />}
                      onClick={() => masivoDialog.open()}
                      disabled={judokas.length === 0}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        height: '40px'
                      }}
                    >
                      Pago Masivo
                    </Button>
                  </Box>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>N°</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Apellidos</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Cinturón</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sensei</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {judokas.map((judoka, index) => (
                        <TableRow key={judoka.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{judoka.nombres}</TableCell>
                          <TableCell>{judoka.apellidos}</TableCell>
                          <TableCell>{judoka.categoria || '-'}</TableCell>
                          <TableCell>{judoka.cinturon_actual || '-'}</TableCell>
                          <TableCell>{judoka.nombre_entrenador || 'No asignado'}</TableCell>
                          <TableCell align="center">
                        <Tooltip title="Ver Pagos Pendientes">
                          <IconButton
                            color="warning"
                            onClick={() => pagosListDialog.open(judoka)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver Historial">
                          <IconButton
                            color="success"
                            onClick={() => historialDialog.open(judoka)}
                            size="small"
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Nuevo Pago">
                          <IconButton
                            color="primary"
                            onClick={() => handleNuevoPago(judoka)}
                            size="small"
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
              )}
            </>
          )}
        </Box>

        <Dialog open={pagoDialog.isOpen} onClose={pagoDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Crear Nuevo Pago</DialogTitle>
          <DialogContent>
            {pagoDialog.data && (
              <PagoForm
                judokaId={pagoDialog.data.id}
                judokaNombre={`${pagoDialog.data.nombres} ${pagoDialog.data.apellidos}`}
                onSuccess={handlePagoSuccess}
                onCancel={pagoDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={pagosListDialog.isOpen} onClose={pagosListDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>
            Pagos Pendientes - {pagosListDialog.data?.nombres} {pagosListDialog.data?.apellidos}
          </DialogTitle>
          <DialogContent>
            {pagosListDialog.data && (
              <PagosList
                judokaId={pagosListDialog.data.id}
                judokaNombre={`${pagosListDialog.data.nombres} ${pagosListDialog.data.apellidos}`}
                onPagoDeleted={refreshPagos}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={historialDialog.isOpen} onClose={historialDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>
            Historial de Pagos - {historialDialog.data?.nombres} {historialDialog.data?.apellidos}
          </DialogTitle>
          <DialogContent>
            {historialDialog.data && (
              <HistorialPagos
                judokaId={historialDialog.data.id}
                judokaNombre={`${historialDialog.data.nombres} ${historialDialog.data.apellidos}`}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={masivoDialog.isOpen} onClose={masivoDialog.close} maxWidth="md" fullWidth>
          <DialogTitle>Crear Pago Masivo</DialogTitle>
          <DialogContent>
            <PagoMasivoForm
              judokas={judokas}
              onSuccess={handlePagoMasivoSuccess}
              onCancel={masivoDialog.close}
            />
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}
