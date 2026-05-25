'use client'

import React, { useState } from 'react'
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Switch,
  Stack,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BadgeIcon from '@mui/icons-material/Badge'
import InfoIcon from '@mui/icons-material/Info'
import { Arbitro } from '@/models/arbitro'
import { DataTable, SearchBar, FilterSelect, Column } from '@/components/ui'
import Pagination from '@/components/common/Pagination'
import AuditModal from '@/components/common/AuditModal'
import { useArbitroList } from '@/hooks/useArbitroList'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

interface ArbitroListProps {
  onEdit?: (arbitro: Arbitro) => void
  onDelete?: (arbitro: Arbitro) => void
  onCertificacion?: (arbitro: Arbitro) => void
  refreshTrigger?: number
  readOnly?: boolean
}

export default function ArbitroList({
  onEdit,
  onDelete,
  onCertificacion,
  refreshTrigger = 0,
  readOnly = false,
}: ArbitroListProps) {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [auditItem, setAuditItem] = useState<Arbitro | null>(null)

  const {
    toggleStatus,
    filteredData,
    state,
    dispatch,
  } = useArbitroList('', refreshTrigger)

  const { loading, error } = state

  const isManagement = user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION

  const columns = [
    {
      id: 'index',
      label: 'N°',
      align: 'center' as const,
      render: (_: any, index: number) => (
        <Typography variant="body2" color="text.secondary">
          {(page - 1) * itemsPerPage + (index ?? 0) + 1}
        </Typography>
      ),
    },
    {
      id: 'nombre',
      label: 'Árbitro',
      render: (a: Arbitro) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {a.nombres} {a.apellidos}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            CI: {a.ci}{a.ci_extension ? `-${a.ci_extension}` : ''} {!a.ci && 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'contacto',
      label: 'Contacto',
      render: (a: Arbitro) => (
        <Box>
          <Typography variant="body2">{a.email || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {a.numero_celular || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'nivel',
      label: 'Nivel',
      render: (a: Arbitro) => (
        <Box
          sx={{
            display: 'inline-block',
            px: 1.5,
            py: 0.25,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'primary.main',
            color: 'primary.main',
            fontSize: '0.75rem',
            textAlign: 'center',
            minWidth: 80,
          }}
        >
          {a.nivel_arbitraje || 'N/A'}
        </Box>
      ),
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (a: Arbitro) => (
        <Switch
          size="medium"
          checked={a.activo}
          onChange={() => toggleStatus(a.id, a.activo)}
          disabled={readOnly || !isManagement || loading}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#4caf50',
              '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' },
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#4caf50',
              opacity: 0.5,
            },
            '& .MuiSwitch-switchBase': {
              color: '#f44336',
              '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' },
            },
            '& .MuiSwitch-switchBase + .MuiSwitch-track': {
              backgroundColor: '#f44336',
              opacity: 0.5,
            },
            '& .MuiSwitch-switchBase.Mui-disabled': {
              color: (a.activo ? '#4caf50' : '#f44336') + ' !important',
              opacity: '1 !important',
            },
            '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
              backgroundColor: (a.activo ? '#4caf50' : '#f44336') + ' !important',
              opacity: '0.5 !important',
            },
            '& .MuiSwitch-switchBase.Mui-disabled .MuiSwitch-thumb': {
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            },
            '& .MuiSwitch-thumb': {
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }
          }}
        />
      ),
    },
    {
      id: 'certificaciones',
      label: 'Certificaciones',
      align: 'center' as const,
      render: (a: Arbitro) => (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            mx: 'auto',
          }}
        >
          {a.total_certificaciones || 0}
        </Box>
      ),
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right' as const,
      render: (a: Arbitro) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onCertificacion && (
            <Tooltip title="Certificaciones">
              <IconButton size="small" onClick={() => onCertificacion(a)} color="primary">
                <BadgeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(a)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Eliminar">
              <IconButton size="small" onClick={() => onDelete(a)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isManagement && (
            <Tooltip title="Ver Auditoría">
              <IconButton size="small" onClick={() => setAuditItem(a)} color="info">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ].filter((col) => {
    if (col.id === 'estado') {
      return isManagement
    }
    return true
  }) as Column<Arbitro>[]

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={state.globalFilter}
          onChange={(val) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: val })}
          placeholder="Buscar por nombre, carnet, nivel..."
          onToggleFilters={() => dispatch({ type: 'TOGGLE_SHOW_FILTERS' })}
          showFilters={state.showFilters}
        >
          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FilterSelect
              label="Nivel de Arbitraje"
              value={state.nivelFilter}
              onChange={(e) => dispatch({ type: 'SET_NIVEL_FILTER', payload: e.target.value })}
              options={[
                { value: 'all', label: 'Todos los niveles' },
                { value: 'Nacional', label: 'Nacional' },
                { value: 'Departamental', label: 'Departamental' },
                { value: 'Internacional', label: 'Internacional' },
              ]}
            />
            <FilterSelect
              label="Estado"
              value={state.estadoFilter}
              onChange={(e) => dispatch({ type: 'SET_ESTADO_FILTER', payload: e.target.value })}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'activo', label: 'Activos' },
                { value: 'inactivo', label: 'Inactivos' },
              ]}
            />
          </Box>
        </SearchBar>
      </Box>

      {error && (
        <Box mb={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <DataTable
        data={paginatedData}
        columns={columns}
        isLoading={loading}
        keyExtractor={(a) => a.id}
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

      <AuditModal
        open={!!auditItem}
        onClose={() => setAuditItem(null)}
        updatedAt={auditItem?.updated_at}
        createdAt={auditItem?.created_at}
        updatedByNombre={auditItem?.modificado_por_nombre}
        entityName="Árbitro"
      />
    </>
  )
}
