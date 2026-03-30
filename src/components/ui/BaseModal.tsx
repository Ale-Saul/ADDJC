'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';

export interface BaseModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

export function BaseModal({
  open,
  title,
  onClose,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
}: BaseModalProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth={fullWidth}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1, 
        borderColor: 'divider',
        mb: 2 
      }}>
        <Typography variant="h6" component="span" fontWeight="bold">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  )
}