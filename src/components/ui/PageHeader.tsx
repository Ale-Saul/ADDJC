'use client'

import { Box, Typography, Button, IconButton, TextField, InputAdornment } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actionLabel?: string
  actionIcon?: ReactNode
  onAction?: () => void
  onSearch?: (value: string) => void
  searchPlaceholder?: string
}

export function PageHeader({
  title,
  actionLabel,
  actionIcon = <AddIcon />,
  onAction,
  onSearch,
  searchPlaceholder = 'Buscar...'
}: PageHeaderProps) {
  return (
    <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
      <Typography variant="h4" component="h1" fontWeight="bold">
        {title}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {onSearch && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
        
        {actionLabel && onAction && (
          <Button
            variant="contained"
            color="primary"
            startIcon={actionIcon}
            onClick={onAction}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  )
}