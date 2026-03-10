'use client'

import { useState, useCallback } from 'react'
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
  InputAdornment,
  Checkbox,
  Chip
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
import PagoForm from '@/components/pagos/PagoForm'
import PagosList from '@/components/pagos/PagosList'
import HistorialPagos from '@/components/pagos/HistorialPagos'
import PagoMasivoForm from '@/components/pagos/PagoMasivoForm'
import PagosStats from '@/components/pagos/PagosStats'
import { useDialog } from '@/hooks/useDialog'
import { CATEGORIES } from '@/utils/constants'
import { usePagosManager } from '@/hooks/usePagosManager'

export default function PagosPage() {
  const { user } = useAuth()
  const {
    isAdmin,
    judokas,
    pagos,
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    refreshAll
  } = usePagosManager(user)

  // Diálogos
  const pagoDialog = useDialog()
  const pagosListDialog = useDialog()
  const historialDialog = useDialog()
  const masivoDialog = useDialog()

  // Selección de judokas para Pago Masivo
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const isAllSelected = judokas.length > 0 && judokas.every(j => selectedIds.has(j.id))
  const isIndeterminate = judokas.some(j => selectedIds.has(j.id)) && !isAllSelected

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(judokas.map(j => j.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const judokasParaMasivo = selectedIds.size > 0
    ? judokas.filter(j => selectedIds.has(j.id))
    : judokas

  const handleNuevoPago = (judoka: Judoka) => {
    pagoDialog.open(judoka)
  }

  const handlePagoSuccess = () => {
    pagoDialog.close()
    refreshAll()
  }

  const handlePagoMasivoSuccess = () => {
    masivoDialog.close()
    setSelectedIds(new Set())
    refreshAll()
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'encargado']}>
      <Layout>
        <Box mb={4}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Gestión de Pagos y Cuotas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra las cuotas mensuales y pagos de los judokas
          </Typography>
        </Box>

        {loading && judokas.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Dashboard de Estadísticas */}
            <PagosStats pagos={pagos} />

            {/* Barra de Filtros */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }} variant="outlined">
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar judoka por nombre, carnet o club..."
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
                      endIcon={filters.showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => filters.setShowFilters(!filters.showFilters)}
                      color={filters.showFilters ? 'primary' : 'inherit'}
                      sx={{ 
                        flexGrow: { xs: 1, md: 0 },
                        backgroundColor: 'white',
                        height: '40px',
                        textTransform: 'none',
                        borderColor: filters.showFilters ? 'primary.main' : 'rgba(0, 0, 0, 0.23)'
                      }}
                    >
                      Filtros
                    </Button>

                    {(filters.senseiFilter !== 'all' || filters.categoriaFilter !== 'all' || filters.clubFilter !== 'all' || searchTerm !== '') && (
                      <Tooltip title="Limpiar filtros">
                        <IconButton onClick={filters.clearFilters} color="warning" size="small">
                          <ClearIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>

                <Collapse in={filters.showFilters}>
                  <Stack 
                    direction={{ xs: 'column', md: 'row' }} 
                    spacing={2} 
                    alignItems="center"
                    sx={{ pt: 1 }}
                  >
                    {isAdmin && (
                      <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white', flexGrow: { xs: 1, md: 0 } }}>
                        <InputLabel>Club</InputLabel>
                        <Select
                          value={filters.clubFilter}
                          label="Club"
                          onChange={(e) => filters.setClubFilter(e.target.value)}
                        >
                          <MenuItem value="all">Todos los clubes</MenuItem>
                          {[...filters.clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club)).map(club => (
                            <MenuItem key={club.id} value={club.id}>
                              {club.nombre_club}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white', flexGrow: { xs: 1, md: 0 } }}>
                      <InputLabel>Sensei</InputLabel>
                      <Select
                        value={filters.senseiFilter}
                        label="Sensei"
                        onChange={(e) => filters.setSenseiFilter(e.target.value)}
                      >
                        <MenuItem value="all">Todos los senseis</MenuItem>
                        {filters.senseisList.map(name => (
                          <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white', flexGrow: { xs: 1, md: 0 } }}>
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={filters.categoriaFilter}
                        label="Categoría"
                        onChange={(e) => filters.setCategoriaFilter(e.target.value)}
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
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }} variant="outlined">
                <Typography color="text.secondary">
                  No se encontraron judokas con los criterios de búsqueda seleccionados
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" fontWeight="bold">
                      Lista de Judokas
                    </Typography>
                    {selectedIds.size > 0 && (
                      <Chip
                        label={`${selectedIds.size} seleccionado${selectedIds.size !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={() => setSelectedIds(new Set())}
                        aria-label={`Limpiar selección de ${selectedIds.size} judokas`}
                      />
                    )}
                  </Stack>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<GroupAddIcon />}
                    onClick={() => masivoDialog.open()}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 'bold',
                      height: '44px',
                      px: 3,
                      minWidth: '160px'
                    }}
                  >
                    {selectedIds.size > 0 ? `Pago Masivo (${selectedIds.size})` : 'Pago Masivo'}
                  </Button>
                </Box>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ width: '52px' }}>
                        <Checkbox
                          size="small"
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          onChange={toggleSelectAll}
                          inputProps={{ 'aria-label': 'Seleccionar todos los judokas' }}
                          sx={{ '&:hover': { cursor: 'pointer' } }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>N°</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Judoka</TableCell>
                      {isAdmin && <TableCell sx={{ fontWeight: 'bold' }}>Club</TableCell>}
                      <TableCell sx={{ fontWeight: 'bold' }}>Categoría / Cinturón</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Sensei</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {judokas.map((judoka, index) => (
                      <TableRow
                        key={judoka.id}
                        hover
                        selected={selectedIds.has(judoka.id)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={selectedIds.has(judoka.id)}
                            onChange={() => toggleSelectOne(judoka.id)}
                            inputProps={{ 'aria-label': `Seleccionar ${judoka.nombres} ${judoka.apellidos}` }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {judoka.nombres} {judoka.apellidos}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            CI: {judoka.ci || '-'}
                          </Typography>
                        </TableCell>
                        {isAdmin && <TableCell>{judoka.nombre_club || '-'}</TableCell>}
                        <TableCell>
                          <Typography variant="body2">{judoka.categoria || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{judoka.cinturon_actual || '-'}</Typography>
                        </TableCell>
                        <TableCell>{judoka.nombre_entrenador || 'No asignado'}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Ver Pagos Pendientes">
                              <IconButton
                                color="warning"
                                onClick={() => pagosListDialog.open(judoka)}
                                size="small"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Ver Historial">
                              <IconButton
                                color="success"
                                onClick={() => historialDialog.open(judoka)}
                                size="small"
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Nuevo Pago Individual">
                              <IconButton
                                color="primary"
                                onClick={() => handleNuevoPago(judoka)}
                                size="small"
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Diálogos */}
        <Dialog open={pagoDialog.isOpen} onClose={pagoDialog.close} maxWidth="md" fullWidth>
          <DialogTitle fontWeight="bold">Crear Nuevo Pago</DialogTitle>
          <DialogContent dividers>
            {pagoDialog.data && (
              <PagoForm
                judokaId={pagoDialog.data.id}
                judokaNombre={`${pagoDialog.data.nombres} ${pagoDialog.data.apellidos}`}
                clubId={pagoDialog.data.club_id || undefined}
                onSuccess={handlePagoSuccess}
                onCancel={pagoDialog.close}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={pagosListDialog.isOpen} onClose={pagosListDialog.close} maxWidth="md" fullWidth>
          <DialogTitle fontWeight="bold">
            Pagos Pendientes - {pagosListDialog.data?.nombres} {pagosListDialog.data?.apellidos}
          </DialogTitle>
          <DialogContent dividers>
            {pagosListDialog.data && (
              <PagosList
                judokaId={pagosListDialog.data.id}
                judokaNombre={`${pagosListDialog.data.nombres} ${pagosListDialog.data.apellidos}`}
                onPagoDeleted={refreshAll}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={historialDialog.isOpen} onClose={historialDialog.close} maxWidth="md" fullWidth>
          <DialogTitle fontWeight="bold">
            Historial de Pagos - {historialDialog.data?.nombres} {historialDialog.data?.apellidos}
          </DialogTitle>
          <DialogContent dividers>
            {historialDialog.data && (
              <HistorialPagos
                judokaId={historialDialog.data.id}
                judokaNombre={`${historialDialog.data.nombres} ${historialDialog.data.apellidos}`}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={masivoDialog.isOpen} onClose={masivoDialog.close} maxWidth="md" fullWidth>
          <DialogTitle fontWeight="bold">Crear Pago Masivo</DialogTitle>
          <DialogContent dividers>
            <PagoMasivoForm
              judokas={judokasParaMasivo}
              onSuccess={handlePagoMasivoSuccess}
              onCancel={masivoDialog.close}
            />
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  )
}
