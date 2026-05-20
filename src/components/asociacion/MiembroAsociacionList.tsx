'use client'

import { useState } from 'react'
import {
  Chip,
  IconButton,
  Box,
  Typography,
  Stack,
  Tooltip,
  Switch,
  Grid,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import InfoIcon from '@mui/icons-material/Info'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')
import { MiembroAsociacion } from '@/models/asociacion'
import { DataTable, SearchBar, FilterSelect } from '@/components/ui'
import Pagination from '@/components/common/Pagination'
import AuditModal from '@/components/common/AuditModal'
import { useMiembroAsociacionList } from '@/hooks/useMiembroAsociacionList'
import { Column } from '@/components/ui/DataTable'
import { CARGOS_ASOCIACION } from '@/constants/globales'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

interface Props {
  onEdit: (miembro: MiembroAsociacion) => void
  onDelete: (miembro: MiembroAsociacion) => void
  refreshTrigger?: number
}

export default function MiembroAsociacionList({ onEdit, onDelete, refreshTrigger }: Props) {
  const {
    state: { loading, error, globalFilter, showFilters, filters },
    filteredData,
    toggleStatus,
    dispatch,
  } = useMiembroAsociacionList('', refreshTrigger)

  const { user } = useAuth()
  const isAdminOrAsoc = user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION

  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [auditItem, setAuditItem] = useState<any>(null)

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const columns: Column<MiembroAsociacion>[] = [
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
      id: 'nombreCompleto',
      label: 'Miembro',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {`${row.nombres} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            CI: {row.ci ? (row.ci_extension ? `${row.ci}-${row.ci_extension}` : row.ci) : '-'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'contacto',
      label: 'Contacto',
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.email || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.numero_celular || 'Sin celular'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'cargo',
      label: 'Cargo',
      render: (row) => {
        const value = row.cargo || 'Sin Cargo'
        return (
          <Chip
            label={value}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />
        )
      },
    },
    {
      id: 'fecha_ingreso',
      label: 'Ingreso',
      render: (row) => {
        const val = row.fecha_ingreso
        return val ? <Typography variant="body2">{dayjs(val).format('DD MMM YYYY')}</Typography> : '-'
      }
    },
    {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      render: (row) => (
        <Tooltip title={row.activo ? 'Desactivar' : 'Activar'}>
          <Switch
            checked={!!row.activo}
            onChange={() => toggleStatus(row.id, !!row.activo)}
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
            }}
          />
        </Tooltip>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Editar miembro">
            <IconButton
              size="small"
              onClick={() => onEdit(row)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar miembro">
            <IconButton
              size="small"
              onClick={() => onDelete(row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isAdminOrAsoc && (
            <Tooltip title="Ver Auditoría">
              <IconButton
                size="small"
                onClick={() => setAuditItem(row)}
                color="info"
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    }
  ]

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <SearchBar
        value={globalFilter}
        onChange={(val) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: val })}
        placeholder="Buscar por nombre, CI o cargo..."
        onToggleFilters={() => dispatch({ type: 'TOGGLE_SHOW_FILTERS' })}
        showFilters={showFilters}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FilterSelect
              label="Filtrar por Cargo"
              value={filters.cargo || 'all'}
              onChange={(e) => dispatch({ type: 'SET_CARGO_FILTER', payload: e.target.value })}
              options={[
                { value: 'all', label: 'Todos los cargos' },
                ...CARGOS_ASOCIACION.map(c => ({ value: c, label: c }))
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FilterSelect
              label="Filtrar por Estado"
              value={filters.estado || 'all'}
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

      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={loading}
        keyExtractor={(row) => row.id}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <AuditModal
        open={!!auditItem}
        onClose={() => setAuditItem(null)}
        updatedAt={auditItem?.updated_at}
        createdAt={auditItem?.created_at}
        updatedByNombre={auditItem?.modificado_por_nombre}
        entityName="Miembro de Asociación"
      />
    </Box>
  )
}

