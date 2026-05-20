'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'

interface AuditModalProps {
  open: boolean
  onClose: () => void
  updatedAt?: string
  createdAt?: string
  updatedByNombre?: string
  entityName?: string
}

export default function AuditModal({
  open,
  onClose,
  updatedAt,
  createdAt,
  updatedByNombre,
  entityName = 'Registro',
}: AuditModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No registrada'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('es-BO', {
        dateStyle: 'long',
        timeStyle: 'short'
      })
    } catch {
      return 'Fecha inválida'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon color="info" />
        <Box component="span" sx={{ typography: 'h6' }}>
          Detalles de Auditoría - {entityName}
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              MODIFICADO POR
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {updatedByNombre || 'Sistema / Desconocido'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              FECHA Y HORA DE MODIFICACIÓN
            </Typography>
            <Typography variant="body1">
              {formatDate(updatedAt)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              FECHA DE REGISTRO
            </Typography>
            <Typography variant="body1">
              {formatDate(createdAt)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
