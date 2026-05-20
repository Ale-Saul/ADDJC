'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Alert,
  Switch,
  IconButton,
  Tooltip,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import InfoIcon from '@mui/icons-material/Info'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddLinkIcon from '@mui/icons-material/AddLink'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import { Judoka } from '@/models/judoka'
import { DataTable, SearchBar, FilterSelect } from '@/components/ui'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Pagination from '@/components/common/Pagination'
import AuditModal from '@/components/common/AuditModal'
import { judokaController } from '@/controllers/judokaController'
import { useJudokaList } from '@/hooks/useJudokaList'
import { CATEGORIES, BELT_COLORS } from '@/constants/globales'
import { Grid } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'

interface JudokaListProps {
  judokas?: Judoka[]
  isLoading?: boolean
  onEdit?: (judoka: Judoka) => void
  onDelete?: (judoka: Judoka) => void
  refreshTrigger?: number
  clubId?: string | null
  entrenadorId?: string
  senseiId?: string
  searchTerm?: string
  itemsPerPage?: number
  showUnassigned?: boolean
  readOnly?: boolean
  singleSenseiMode?: boolean
}

const BELT_COLOR_MAP: Record<string, string> = {
  'Blanco': '#FFFFFF',
  'Amarillo': '#FFEB3B',
  'Naranja': '#FF9800',
  'Verde': '#4CAF50',
  'Azul': '#2196F3',
  'Café': '#795548',
  'Negro': '#212121',
}

export default function JudokaList({
  judokas: judokasProp,
  isLoading: isLoadingProp,
  onEdit,
  onDelete,
  refreshTrigger,
  clubId,
  entrenadorId,
  senseiId,
  searchTerm: externalSearchTerm = '',
  itemsPerPage: initialItemsPerPage = 10,
  showUnassigned = false,
  readOnly = false,
  singleSenseiMode = false
}: JudokaListProps) {
    const { user } = useAuth()
    const isAdminOrAsoc = user?.rol === ROL.ADMIN || user?.rol === ROL.ASOCIACION
    const isEncargado = user?.rol === ROL.ENCARGADO
    const isSensei = user?.rol === ROL.SENSEI

    const {
    loading,
    error,
    toggleStatus,
    deleteLocalJudoka,
    updateLocalJudoka,
    filteredData,
    state,
    setGlobalFilter,
    setFilter,
    toggleShowFilters
  } = useJudokaList({
    clubId: clubId || undefined,
    entrenadorId,
    refreshTrigger,
    judokasProp,
    initialSearch: externalSearchTerm,
    singleSenseiMode
  })

  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAfiliar = async (judoka: Judoka) => {
    if (!clubId) return
    setActionLoading(judoka.id)
    try {
      const payload: any = { club_id: clubId }
      if (isSensei && user?.sensei_id) {
        payload.entrenador_id = user.sensei_id
      }
      const response = await judokaController.updateJudoka(judoka.id, payload)
      if (response.success && response.data) {
        updateLocalJudoka(judoka.id, response.data)
      } else {
        alert(response.error || 'Error al afiliar judoka')
      }
    } catch (err) {
      alert('Error inesperado al afiliar judoka')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDesafiliar = async (judoka: Judoka) => {
    setActionLoading(judoka.id)
    try {
      const response = await judokaController.updateJudoka(judoka.id, { club_id: null as any, entrenador_id: null as any })
      if (response.success && response.data) {
        updateLocalJudoka(judoka.id, response.data)
      } else {
        alert(response.error || 'Error al desafiliar judoka')
      }
    } catch (err) {
      alert('Error inesperado al desafiliar judoka')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTomarMando = async (judoka: Judoka) => {
    if (!user?.sensei_id) return
    setActionLoading(judoka.id)
    try {
      const response = await judokaController.updateJudoka(judoka.id, { entrenador_id: user.sensei_id })
      if (response.success && response.data) {
        updateLocalJudoka(judoka.id, response.data)
      } else {
        alert(response.error || 'Error al tomar mando')
      }
    } catch (err) {
      alert('Error inesperado al tomar mando')
    } finally {
      setActionLoading(null)
    }
  }

  const handleQuitarMando = async (judoka: Judoka) => {
    setActionLoading(judoka.id)
    try {
      const response = await judokaController.updateJudoka(judoka.id, { entrenador_id: null as any })
      if (response.success && response.data) {
        updateLocalJudoka(judoka.id, response.data)
      } else {
        alert(response.error || 'Error al quitar mando')
      }
    } catch (err) {
      alert('Error inesperado al quitar mando')
    } finally {
      setActionLoading(null)
    }
  }

  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    )
  }, [filteredData, page, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const [pendingDelete, setPendingDelete] = useState<Judoka | null>(null)
  const [auditItem, setAuditItem] = useState<Judoka | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const isLoading = isLoadingProp !== undefined ? isLoadingProp : loading

  const handleDeleteClick = (judoka: Judoka) => {
    if (onDelete) {
      onDelete(judoka)
    } else {
      setPendingDelete(judoka)
    }
  }

  const handleAuditClick = (judoka: Judoka) => {
    setAuditItem(judoka)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmLoading(true)
    try {
      const response = await judokaController.deleteJudoka(pendingDelete.id)
      if (response.success) {
        deleteLocalJudoka(pendingDelete.id)
        setPendingDelete(null)
      } else {
        alert(response.error || 'Error al eliminar judoka')
      }
    } catch {
      alert('Error inesperado al eliminar judoka')
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns = useMemo<any[]>(() => {
    const cols = [
      {
        id: 'index',
        label: 'N°',
        align: 'center',
        render: (_: any, index: number) => (
          <Typography variant="body2" color="text.secondary">
            {(page - 1) * itemsPerPage + (index ?? 0) + 1}
          </Typography>
        ),
      },
      {
        id: 'nombres',
        label: 'Judoka',
        render: (j: Judoka) => (
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {j.nombres} {j.apellidos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              CI: {j.ci ? (j.ci_extension ? `${j.ci}-${j.ci_extension}` : j.ci) : '-'}
            </Typography>
            {showUnassigned && !j.club_id && (
              <Typography variant="caption" color="error" sx={{ fontStyle: 'italic', fontWeight: 'medium', display: 'block' }}>
                Sin club asignado
              </Typography>
            )}
            {isEncargado && clubId && (
              <Box mt={1}>
                {j.club_id === clubId ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={actionLoading === j.id ? <CircularProgress size={16} /> : <LinkOffIcon />}
                    onClick={() => handleDesafiliar(j)}
                    disabled={!!actionLoading}
                    sx={{ fontSize: '0.7rem', py: 0 }}
                  >
                    Desafiliar del Club
                  </Button>
                ) : !j.club_id ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={actionLoading === j.id ? <CircularProgress size={16} /> : <AddLinkIcon />}
                    onClick={() => handleAfiliar(j)}
                    disabled={!!actionLoading}
                    sx={{ fontSize: '0.7rem', py: 0 }}
                  >
                    Inscribir a mi Club
                  </Button>
                ) : null}
              </Box>
            )}
            {isSensei && user?.club_id && (
              <Box mt={1}>
                {!j.club_id ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={actionLoading === j.id ? <CircularProgress size={16} /> : <AddLinkIcon />}
                    onClick={() => handleAfiliar(j)}
                    disabled={!!actionLoading}
                    sx={{ fontSize: '0.7rem', py: 0 }}
                  >
                    Inscribir a mi mando
                  </Button>
                ) : j.club_id === user.club_id ? (
                  <>
                    {j.entrenador_id === user.sensei_id ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={actionLoading === j.id ? <CircularProgress size={16} /> : <LinkOffIcon />}
                        onClick={() => handleQuitarMando(j)}
                        disabled={!!actionLoading}
                        sx={{ fontSize: '0.7rem', py: 0 }}
                      >
                        Quitar de mi mando
                      </Button>
                    ) : !j.entrenador_id ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={actionLoading === j.id ? <CircularProgress size={16} /> : <AddLinkIcon />}
                        onClick={() => handleTomarMando(j)}
                        disabled={!!actionLoading}
                        sx={{ fontSize: '0.7rem', py: 0 }}
                      >
                        Tomar a mi mando
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </Box>
            )}
          </Box>
        )
      },
      {
        id: 'contacto',
        label: 'Contacto',
        render: (j: Judoka) => (
          <Box>
            <Typography variant="body2">{j.numero_celular || '-'}</Typography>
            <Typography variant="caption" color="text.secondary">
              WhatsApp
            </Typography>
          </Box>
        ),
      },
      {
        id: 'categoria',
        label: 'Categoría',
        render: (j: Judoka) => j.categoria || '-'
      },
      {
        id: 'cinturon_actual',
        label: 'Cinturón',
        render: (j: Judoka) => {
          const belt = j.cinturon_actual
          if (!belt) return '-'
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: BELT_COLOR_MAP[belt] || '#ccc',
                  border: belt === 'Blanco' ? '1px solid #ddd' : 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              />
              {belt}
            </Box>
          )
        }
      }
    ]

    if (!readOnly || isEncargado) {
      cols.push({
        id: 'activo',
        label: 'Estado',
        render: (j: Judoka) => {
          const canChangeStatus = isAdminOrAsoc || isEncargado;
          return (
            <Tooltip title={canChangeStatus ? (j.activo ? 'Desactivar' : 'Activar') : (j.activo ? 'Activo' : 'Inactivo')}>
              <span>
                <Switch
                  checked={!!j.activo}
                  onChange={() => canChangeStatus && toggleStatus(j.id, !!j.activo)}
                  size="medium"
                  disabled={!canChangeStatus}
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
                      color: (j.activo ? '#4caf50' : '#f44336') + ' !important',
                      opacity: '1 !important'
                    },
                    '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                      backgroundColor: (j.activo ? '#4caf50' : '#f44336') + ' !important',
                      opacity: '0.5 !important'
                    }
                  }}
                />
              </span>
            </Tooltip>
          );
        }
      })

      cols.push({
        id: 'acciones',
        label: 'Acciones',
        render: (j: Judoka) => (
          <Box display="flex" gap={1} justifyContent="flex-end">
            {onEdit && (
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onEdit(j)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {!isEncargado && !isSensei && (
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(j)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(isAdminOrAsoc || isEncargado) && (
              <Tooltip title="Ver Auditoría">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleAuditClick(j)}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      })
    }
    return cols
  }, [onEdit, readOnly, showUnassigned, toggleStatus, isSensei, isEncargado, isAdminOrAsoc])

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
  }

  return (
    <>
      <SearchBar
        value={state.globalFilter}
        onChange={setGlobalFilter}
        placeholder="Buscar por nombre, carnet o categoría..."
        onToggleFilters={toggleShowFilters}
        showFilters={state.showFilters}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FilterSelect
              label="Categoría"
              value={state.categoriaFilter}
              onChange={(e) => setFilter('categoria', e.target.value)}
              options={[
                { value: 'all', label: 'Todas las categorías' },
                ...CATEGORIES.map(c => ({ value: c, label: c }))
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FilterSelect
              label="Cinturón"
              value={state.cinturonFilter}
              onChange={(e) => setFilter('cinturon', e.target.value)}
              options={[
                { value: 'all', label: 'Todos los cinturones' },
                ...BELT_COLORS.map(c => ({ value: c, label: c }))
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FilterSelect
              label="Estado"
              value={state.estadoFilter}
              onChange={(e) => setFilter('estado', e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'activo', label: 'Solo Activos' },
                { value: 'inactivo', label: 'Solo Inactivos' }
              ]}
            />
          </Grid>
        </Grid>
      </SearchBar>
      
      <DataTable<Judoka>
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron judokas"
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

      {!onDelete && (
        <ConfirmDialog
          open={!!pendingDelete}
          title="Eliminar Judoka"
          message={pendingDelete ? `Estás seguro de eliminar al judoka "${pendingDelete.nombres} "?` : ''}
          confirmText="Eliminar"
          onConfirm={handleConfirmDelete}
          onClose={() => setPendingDelete(null)}
          loading={confirmLoading}
        />
      )}

      <AuditModal
        open={!!auditItem}
        onClose={() => setAuditItem(null)}
        updatedAt={auditItem?.updated_at}
        createdAt={auditItem?.created_at}
        updatedByNombre={auditItem?.modificado_por_nombre}
        entityName="Judoka"
      />
    </>
  )
}

