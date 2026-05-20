import { useState, useEffect } from 'react'
import {
  Chip,
  IconButton,
  Switch,
  Tooltip,
  MenuItem,
  Box,
  Typography,
  Pagination as MuiPagination,
  Grid
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import DescriptionIcon from '@mui/icons-material/Description'
import PeopleIcon from '@mui/icons-material/People'
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'
import { formatHoraDbToInput } from '@/utils/formatters'
import { useClubList } from '@/hooks/useClubList'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Pagination from '@/components/common/Pagination'
import { DataTable, Column, FilterSelect, SearchBar } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

function formatHorarioContacto(club: Club): string | null {
  const inicio = formatHoraDbToInput(club.horario_inicio)
  const fin = formatHoraDbToInput(club.horario_fin)
  if (inicio && fin) return `${inicio}-${fin}`
  if (inicio) return inicio
  if (fin) return fin
  return null
}

interface ClubListProps {
  onEdit?: (club: Club) => void
  onDelete?: (club: Club) => void
  onViewJudokas?: (club: Club) => void
  onViewMiembros?: (club: Club) => void
  onViewDocumentos?: (club: Club) => void
  refreshTrigger?: number
  readOnly?: boolean
}

export default function ClubList({ onEdit, onDelete, onViewJudokas, onViewMiembros, onViewDocumentos, refreshTrigger = 0, readOnly = false }: ClubListProps) {
  const { user } = useAuth()
  const isEncargado = user?.rol === ROL.ENCARGADO
  const isAdminOrAsoc = user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION

  const { state, loadClubes, toggleStatus, filteredData, dispatch } = useClubList('', refreshTrigger)
  const { loading, error } = state

  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadClubes()
  }, [refreshTrigger, loadClubes])

  const columns: Column<Club>[] = [
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
      id: 'nombre_club',
      label: 'Club',
      render: (club: Club) => (
        <Box display="flex" flexDirection="column">
          <Typography variant="body2" fontWeight="bold">{club.nombre_club}</Typography>
          <Typography variant="caption" color="text.secondary">
            Provincia: {club.provincia}
          </Typography>
          {club.direccion && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Dir: {club.direccion}
            </Typography>
          )}
        </Box>
      )
    },
    {
      id: 'director',
      label: 'Director Técnico',
      render: (club: Club) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {club.director_tecnico ? `${club.director_tecnico.nombres} ${club.director_tecnico.apellidos}` : 'No asignado'}
          </Typography>
          {club.director_tecnico?.ci && (
            <Typography variant="caption" color="text.secondary" display="block">
              CI: {club.director_tecnico.ci}{club.director_tecnico.ci_extension ? `-${club.director_tecnico.ci_extension}` : ''}
            </Typography>
          )}
        </Box>
      )
    },
    {
      id: 'contacto',
      label: 'Contacto',
      render: (club: Club) => {
        const horario = formatHorarioContacto(club)
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {club.telefono_contacto || 'Sin teléfono'}
            </Typography>
            {horario && (
              <Typography variant="caption" color="text.secondary" display="block">
                {horario}
              </Typography>
            )}
          </Box>
        )
      },
    },
    {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      render: (club: Club) => (
        <Tooltip title={isAdminOrAsoc ? (club.activo ? 'Desactivar' : 'Activar') : (club.activo ? 'Activo' : 'Inactivo')}>
          <span>
            <Switch
              checked={!!club.activo}
              onChange={() => isAdminOrAsoc && toggleStatus(club.id, !!club.activo)}
              size="medium"
              disabled={!isAdminOrAsoc}
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
                  color: (club.activo ? '#4caf50' : '#f44336') + ' !important',
                  opacity: '1 !important'
                },
                '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                  backgroundColor: (club.activo ? '#4caf50' : '#f44336') + ' !important',
                  opacity: '0.5 !important'
                }
              }}
            />
          </span>
        </Tooltip>
      )
    }
  ]

  if (!readOnly || isEncargado) {
    columns.push({
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (club: Club) => (
        <Box display="flex" justifyContent="flex-end" gap={1}>
          {onViewDocumentos && (isEncargado ? club.id === user?.club_id : true) && (
            <Tooltip title="Documentos del Club">
              <IconButton size="small" onClick={() => onViewDocumentos(club)} color="info">
                <DescriptionIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {onViewJudokas && (
            <Tooltip title="Ver Judokas">
              <IconButton size="small" onClick={() => onViewJudokas(club)} color="info">
                <DirectionsRunIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onViewMiembros && (
            <Tooltip title="Ver Miembros">
              <IconButton size="small" onClick={() => onViewMiembros(club)} color="info">
                <PeopleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onEdit && !isEncargado && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(club)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onDelete && !isEncargado && (
            <Tooltip title="Eliminar">
              <IconButton size="small" onClick={() => onDelete(club)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    })
  } else if (onViewJudokas || onViewMiembros) {
     columns.push({
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (club: Club) => (
        <Box display="flex" justifyContent="flex-end" gap={1}>          
            {onViewJudokas && (
              <Tooltip title="Ver Judokas">
                <IconButton size="small" onClick={() => onViewJudokas(club)} color="info">
                  <DirectionsRunIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {onViewMiembros && (
              <Tooltip title="Ver Miembros">
                <IconButton size="small" onClick={() => onViewMiembros(club)} color="info">
                  <PeopleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
        </Box>
      )
    })
  }

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  return (
    <Box>
      <SearchBar
        value={state.globalFilter || ''}
        onChange={(val) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: val })}
        placeholder="Buscar por club, dirigente..."
        onToggleFilters={() => dispatch({ type: 'TOGGLE_SHOW_FILTERS' })}
        showFilters={state.showFilters}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FilterSelect
              label="Provincia"
              value={state.filters.municipio || 'all'}
              onChange={(e) => dispatch({ type: 'SET_MUNICIPIO_FILTER', payload: e.target.value })}
              options={[
                { value: 'all', label: 'Todas las provincias' },
                { value: 'Cercado', label: 'Cercado' },
                { value: 'Quillacollo', label: 'Quillacollo' },
                { value: 'Chapare', label: 'Chapare' },
                { value: 'Punata', label: 'Punata' },
                { value: 'Tapacarí', label: 'Tapacarí' },
                { value: 'Ayopaya', label: 'Ayopaya' },
                { value: 'Arani', label: 'Arani' },
                { value: 'Esteban Arce', label: 'Esteban Arce' },
                { value: 'Capinota', label: 'Capinota' },
                { value: 'Germán Jordán', label: 'Germán Jordán' },
                { value: 'Mizque', label: 'Mizque' },
                { value: 'Campero', label: 'Campero' },
                { value: 'Carrasco', label: 'Carrasco' },
                { value: 'Tiraque', label: 'Tiraque' },
                { value: 'Caranavi', label: 'Caranavi' },
                { value: 'Bolívar', label: 'Bolívar' },
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FilterSelect
              label="Estado"
              value={state.filters.estado || 'all'}
              onChange={(e) => dispatch({ type: 'SET_ESTADO_FILTER', payload: e.target.value })}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'activo', label: 'Activos' },
                { value: 'inactivo', label: 'Inactivos' },
              ]}
            />
          </Grid>
        </Grid>
      </SearchBar>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <DataTable
          data={paginatedData}
          columns={columns}
          isLoading={loading}
          keyExtractor={(club) => club.id}
        />
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

      
    </Box>
  )
}









