'use client'

import { useState } from 'react'
import { Chip, IconButton, Box, Typography, Stack, Tooltip, Switch, Grid } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BadgeIcon from '@mui/icons-material/Badge'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
import { useArbitroList } from '@/hooks/useArbitroList'
import Pagination from '@/components/common/Pagination'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { DataTable, Column, FilterSelect, SearchBar } from '@/components/ui'
import { searchInArray } from '@/utils/helpers'
import { NIVELES_ARBITRAJE } from '@/constants/globales'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

interface ArbitroListProps {
  onEdit?: (arbitro: Arbitro) => void
  onDelete?: (arbitro: Arbitro) => void
  onCertificacion?: (arbitro: Arbitro) => void
  refreshTrigger?: number
  searchTerm?: string
  readOnly?: boolean
}

export default function ArbitroList({
  onEdit,
  onDelete,
  onCertificacion,
  refreshTrigger = 0,
  searchTerm: externalSearchTerm = '',
  readOnly = false
}: ArbitroListProps) {
  const { user } = useAuth()
  const isAdminOrAsoc = user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION
  const isEncargado = user?.rol === ROL.ENCARGADO
  const isSensei = user?.rol === ROL.SENSEI
  const isArbitro = user?.rol === ROL.ARBITRO

  const { state, loadArbitros, filteredData, toggleStatus, dispatch } = useArbitroList(externalSearchTerm, refreshTrigger);
  const { loading, error } = state;
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentArbitros = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const handleToggleClick = (arbitro: Arbitro) => {
    if (readOnly) return
    toggleStatus(arbitro.id, !!arbitro.activo)
  }

  const columns: Column<Arbitro>[] = [
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
      id: 'nombre',
      label: 'Árbitro',
      render: (arb: Arbitro) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {arb.nombres} {arb.apellidos}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            CI: {arb.ci ? (arb.ci_extension ? `${arb.ci}-${arb.ci_extension}` : arb.ci) : '-'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'contacto',
      label: 'Contacto',
      render: (arb: Arbitro) => (
        <Box>
          <Typography variant="body2">{arb.email}</Typography>
          <Typography variant="caption" color="text.secondary">{arb.numero_celular || 'Sin celular'}</Typography>
        </Box>
      )
    },
    {
      id: 'nivel_arbitraje',
      label: 'Nivel',
      render: (arb: Arbitro) => (
        <Chip 
          label={arb.nivel_arbitraje} 
          size="small"
          color="primary"
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      render: (arb: Arbitro) => (
        <Tooltip title={isAdminOrAsoc ? (arb.activo ? 'Desactivar' : 'Activar') : (arb.activo ? 'Activo' : 'Inactivo')}>
          <span>
            <Switch
              checked={!!arb.activo}
              onChange={() => isAdminOrAsoc && toggleStatus(arb.id, !!arb.activo)}
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
                    color: (arb.activo ? '#4caf50' : '#f44336') + ' !important',
                    opacity: '1 !important'
                  },
                  '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                    backgroundColor: (arb.activo ? '#4caf50' : '#f44336') + ' !important',
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
      render: (arb: Arbitro) => (
        <Chip 
          label={arb.total_certificaciones || 0} 
          size="small" 
          color={(arb.total_certificaciones || 0) > 0 ? 'primary' : 'default'} 
        />
      )
    }
  ]

  if (!readOnly || isEncargado || isSensei || isArbitro) {
    columns.push({
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (arb: Arbitro) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Certificaciones">
            <IconButton size="small" color="info" onClick={() => onCertificacion?.(arb)}>
              <BadgeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {onEdit && (
            <Tooltip title="Editar">
              <IconButton size="small" color="primary" onClick={() => onEdit?.(arb)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && !isEncargado && (
            <Tooltip title="Eliminar">
              <IconButton size="small" color="error" onClick={() => onDelete?.(arb)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    })
  }

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  return (
    <Box>
      {!readOnly && (
        <SearchBar
          value={state.globalFilter}
          onChange={(val) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: val })}
          placeholder="Buscar por nombre, carnet, nivel..."
          onToggleFilters={() => dispatch({ type: 'TOGGLE_SHOW_FILTERS' })}
          showFilters={state.showFilters}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FilterSelect
                label="Nivel de Arbitraje"
                value={state.nivelFilter}
                onChange={(e) => dispatch({ type: 'SET_NIVEL_FILTER', payload: e.target.value })}
                options={[
                  { value: 'all', label: 'Todos los niveles' },
                  ...NIVELES_ARBITRAJE.map(n => ({ value: n, label: n }))
                ]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
        data={currentArbitros} 
        columns={columns} 
        isLoading={loading}
        keyExtractor={(arb) => arb.id}
      />
      
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





