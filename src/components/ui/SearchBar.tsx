'use client'

import React from 'react'
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  InputAdornment,
  Collapse,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onToggleFilters?: () => void
  showFilters?: boolean
  children?: React.ReactNode // Para los filtros debajo
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  onToggleFilters,
  showFilters = false,
  children
}: SearchBarProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: value && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onChange('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: 'background.paper' }
          }}
        />
        
        {onToggleFilters && (
          <Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
            <IconButton 
              onClick={onToggleFilters}
              color={showFilters ? "primary" : "default"}
              sx={{ 
                border: '1px solid', 
                borderColor: showFilters ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: '8px'
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {children && (
        <Collapse in={showFilters}>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 2, 
            border: '1px solid', 
            borderColor: 'divider' 
          }}>
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}
