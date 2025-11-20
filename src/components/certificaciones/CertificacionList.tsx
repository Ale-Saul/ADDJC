'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import { Certificacion } from '@/models/certificacion'
import { certificacionController } from '@/controllers/certificacionController'

interface CertificacionListProps {
  usuarioId: string
  tipoAfiliado: 'sensei' | 'arbitro'
  onEdit?: (certificacion: Certificacion) => void
  onDelete?: (certificacion: Certificacion) => void
  onAdd?: () => void
  refreshTrigger?: number
}

export default function CertificacionList({
  usuarioId,
  tipoAfiliado,
  onEdit,
  onDelete,
  onAdd,
  refreshTrigger
}: CertificacionListProps) {
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCertificaciones = async () => {
    setLoading(true)
    setError(null)

    const response = await certificacionController.getCertificacionesByUsuario(usuarioId, tipoAfiliado)

    if (response.success && response.data) {
      setCertificaciones(response.data)
    } else {
      setError(response.error || 'Error al cargar las certificaciones')
    }

    setLoading(false)
  }

  useEffect(() => {
    if (usuarioId) {
      loadCertificaciones()
    }
  }, [usuarioId, tipoAfiliado, refreshTrigger])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const getFileIcon = (url: string | null) => {
    if (!url) return null
    if (url.toLowerCase().endsWith('.pdf')) {
      return <PictureAsPdfIcon fontSize="small" color="error" />
    }
    return <ImageIcon fontSize="small" color="primary" />
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      {onAdd && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            size="small"
          >
            Agregar Certificación
          </Button>
        </Box>
      )}

      {certificaciones.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No hay certificaciones registradas
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Fecha Emisión</strong></TableCell>
                <TableCell><strong>Fecha Vencimiento</strong></TableCell>
                <TableCell><strong>Archivo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificaciones.map((certificacion) => (
                <TableRow key={certificacion.id} hover>
                  <TableCell>{certificacion.nombre_certificacion}</TableCell>
                  <TableCell>{certificacion.descripcion || '-'}</TableCell>
                  <TableCell>{formatDate(certificacion.fecha_emision)}</TableCell>
                  <TableCell>{formatDate(certificacion.fecha_vencimiento)}</TableCell>
                  <TableCell>
                    {certificacion.archivo_url ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        {getFileIcon(certificacion.archivo_url)}
                        <Button
                          size="small"
                          href={certificacion.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver
                        </Button>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={certificacion.activo ? 'Activa' : 'Inactiva'}
                      color={certificacion.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {onEdit && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEdit(certificacion)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(certificacion)}
                        title="Eliminar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

