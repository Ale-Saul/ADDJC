'use client'

import { useState, useMemo } from 'react'
import { Box, Typography, Switch, IconButton, Tooltip, Chip, Grid, Stack, Button, CircularProgress } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BadgeIcon from '@mui/icons-material/Badge'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddLinkIcon from '@mui/icons-material/AddLink'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import { Sensei } from '@/models/sensei'
import { useSenseiList } from '@/hooks/useSenseiList'
import Pagination from '@/components/common/Pagination'
import { DataTable, Column, SearchBar, FilterSelect } from '@/components/ui'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { ESPECIALIDADES_SENSEI, GRADOS_DAN } from '@/constants/globales'
import { senseiController } from '@/controllers/senseiController'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

interface SenseiListProps {
  onEdit?: (sensei: Sensei) => void
  onDelete?: (sensei: Sensei) => void
  onCertificacion?: (sensei: Sensei) => void
  refreshTrigger?: number
  clubId?: string
  showUnassigned?: boolean
  readOnly?: boolean
}

export default function SenseiList({
  onEdit,
  onDelete,
  onCertificacion,
  refreshTrigger = 0,
  clubId,
  showUnassigned = false,
  readOnly = false
}: SenseiListProps) {
  const { user } = useAuth()
  const isAdminOrAsoc = user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION
  const isEncargado = user?.rol === ROL.ENCARGADO

  const isJudoka = user?.rol === ROL.JUDOKA

  const { state, filteredData, toggleStatus, loadSenseis, dispatch, updateLocalSensei } = useSenseiList('', refreshTrigger, clubId)
  const { loading, error } = state
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleToggleClick = (sensei: Sensei) => {
    if (readOnly) return
    toggleStatus(sensei.id, !!sensei.activo)
  }

  const handleAfiliar = async (sensei: Sensei) => {
    if (!clubId) return
    setActionLoading(sensei.id)
    try {
      const response = await senseiController.updateSensei(sensei.id, { club_id: clubId })
      if (response.success && response.data) {
        updateLocalSensei(sensei.id, response.data)
      } else {
        alert(response.error || 'Error al afiliar sensei')
      }
    } catch (err) {
      alert('Error inesperado al afiliar sensei')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDesafiliar = async (sensei: Sensei) => {
    setActionLoading(sensei.id)
    try {
      const response = await senseiController.updateSensei(sensei.id, { club_id: null as any })
      if (response.success && response.data) {
        updateLocalSensei(sensei.id, response.data)
      } else {
        alert(response.error || 'Error al desafiliar sensei')
      }
    } catch (err) {
      alert('Error inesperado al desafiliar sensei')
    } finally {
      setActionLoading(null)
    }
  }

  const localFilteredData = useMemo(() => {
    const filtered = filteredData.filter(s => {
      if (clubId) {
        // Si hay clubId (Encargado/Sensei), mostrar los del club y los sin club
        return s.club_id === clubId || (showUnassigned && !s.club_id)
      }
      return true
    })

    // Ordenar: primero los que tienen club, luego los que no
    return [...filtered].sort((a, b) => {
      if (a.club_id && !b.club_id) return -1
      if (!a.club_id && b.club_id) return 1
      return 0
    })
  }, [filteredData, clubId, showUnassigned])

  const columns: Column<Sensei>[] = [
    {
      id: 'index',
      label: 'N°',
      align: 'center',
      render: (_, index) => (
        <Typography variant="body2" color="text.secondary">
          {(page - 1) * itemsPerPage + (index ?? 0) + 1}
        </Typography>
      ),
    },
    {
      id: 'nombres',
      label: 'Sensei',
      render: (s: Sensei) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {s.nombres} {s.apellidos}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            CI: {s.ci ? (s.ci_extension ? `${s.ci}-${s.ci_extension}` : s.ci) : '-'}
          </Typography>
            {showUnassigned && !s.club_id && (
              <Typography variant="caption" color="error" sx={{ fontStyle: 'italic', fontWeight: 'medium', display: 'block' }}>
                Sin club asignado
              </Typography>
            )}
            {isEncargado && clubId && (
              <Box mt={1}>
                {s.club_id === clubId ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={actionLoading === s.id ? <CircularProgress size={16} /> : <LinkOffIcon />}
                    onClick={() => handleDesafiliar(s)}
                    disabled={!!actionLoading}
                    sx={{ fontSize: '0.7rem', py: 0 }}
                  >
                    Desafiliar del Club
                  </Button>
                ) : !s.club_id ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={actionLoading === s.id ? <CircularProgress size={16} /> : <AddLinkIcon />}
                    onClick={() => handleAfiliar(s)}
                    disabled={!!actionLoading}
                    sx={{ fontSize: '0.7rem', py: 0 }}
                  >
                    Inscribir a mi Club
                  </Button>
                ) : null}
              </Box>
            )}
          </Box>
        )
      },
    {
      id: 'contacto',
      label: 'Contacto',
      render: (s: Sensei) => (
        <Box>
          <Typography variant="body2">{s.email || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {s.numero_celular || 'Sin celular'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'grado_dan',
      label: 'Grado Dan',
      render: (s: Sensei) => <Typography variant="body2">{s.grado_dan}</Typography>
    },
    {
      id: 'especialidad',
      label: 'Especialidad',
      render: (s: Sensei) => <Typography variant="body2">{s.especialidad || '-'}</Typography>
    },
    {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      render: (s: Sensei) => (
        <Tooltip title={isAdminOrAsoc ? (s.activo ? 'Desactivar' : 'Activar') : (s.activo ? 'Activo' : 'Inactivo')}>
          <span>
            <Switch
              checked={!!s.activo}
              onChange={() => isAdminOrAsoc && toggleStatus(s.id, !!s.activo)}
              disabled={!isAdminOrAsoc}
              size="medium"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4caf50',
                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4caf50',
                  },
                  '& .MuiSwitch-switchBase': {
                    color: '#f44336',
                    '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' },
                  },
                  '& .MuiSwitch-switchBase + .MuiSwitch-track': {
                    backgroundColor: '#f44336',
                  },
                  '& .MuiSwitch-switchBase.Mui-disabled': {
                    color: (s.activo ? '#4caf50' : '#f44336') + ' !important',
                    opacity: '1 !important'
                  },
                  '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                    backgroundColor: (s.activo ? '#4caf50' : '#f44336') + ' !important',
                    opacity: '0.5 !important'
                  }
                }}
            />
          </span>
        </Tooltip>
      )
    },
    {
      id: 'certificaciones',
      label: 'Certificaciones',
      align: 'center',
      render: (s: Sensei) => (
        <Chip 
          label={s.total_certificaciones || 0} 
          size="small" 
          color={(s.total_certificaciones || 0) > 0 ? 'primary' : 'default'} 
        />
      )
    }
  ]

  if (!readOnly || isEncargado || isJudoka) {
    columns.push({
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (s: Sensei) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onCertificacion && (
            <Tooltip title="Certificaciones">
              <IconButton size="small" onClick={() => onCertificacion(s)} color="info">
                <BadgeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && !isJudoka && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(s)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && !isEncargado && !isJudoka && (
            <Tooltip title="Eliminar">
              <IconButton size="small" onClick={() => onDelete(s)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    })
  } else {
    columns.push({
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (s: Sensei) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onCertificacion && (
            <Tooltip title="Certificaciones">
              <IconButton size="small" onClick={() => onCertificacion(s)} color="info">
                <BadgeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Ver Detalles">
              <IconButton size="small" onClick={() => onEdit(s)} color="info">
                <BadgeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    })
  }

  const paginatedData = localFilteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )
  const totalPages = Math.ceil(localFilteredData.length / itemsPerPage)

  return (
    <>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          {!readOnly && (
            <SearchBar
              value={state.globalFilter}
              onChange={(val) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: val })}
              placeholder="Buscar por nombre, carnet, especialidad..."
              onToggleFilters={() => dispatch({ type: 'TOGGLE_SHOW_FILTERS' })}
              showFilters={state.showFilters}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FilterSelect
                    label="Grado Dan"
                    value={state.gradoDanFilter}
                    onChange={(e) => dispatch({ type: 'SET_GRADO_DAN_FILTER', payload: e.target.value })}
                    options={[
                      { value: 'all', label: 'Todos los grados' },
                      ...GRADOS_DAN.map(g => ({ value: g, label: g }))
                    ]}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FilterSelect
                    label="Especialidad"
                    value={state.especialidadFilter}
                    onChange={(e) => dispatch({ type: 'SET_ESPECIALIDAD_FILTER', payload: e.target.value })}
                    options={[
                      { value: 'all', label: 'Todas las especialidades' },
                      ...ESPECIALIDADES_SENSEI.map(e => ({ value: e, label: e }))
                    ]}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FilterSelect
                    label="Estado"
                    value={state.estadoFilter}
                    onChange={(e) => dispatch({ type: 'SET_ESTADO_FILTER', payload: e.target.value })}
                    options={[
                      { value: 'all', label: 'Todos los estados' },
                      { value: 'activo', label: 'Solo Activos' },
                      { value: 'inactivo', label: 'Solo Inactivos' }
                    ]}
                  />
                </Grid>
              </Grid>
            </SearchBar>
          )}

          <DataTable
            data={paginatedData}
            columns={columns}
            isLoading={loading}
            keyExtractor={(s) => s.id}
          />
        </>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Box>

      
    </>
  )
}







