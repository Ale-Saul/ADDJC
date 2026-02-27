'use client'

import { useState, useEffect, useCallback } from 'react'
import { TextField, InputAdornment, Box } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import IconButton from '@mui/material/IconButton'

interface SearchBarProps {
  placeholder?: string
  onSearch: (searchTerm: string) => void
  debounceMs?: number
  fullWidth?: boolean
}

export default function SearchBar({ 
  placeholder = 'Buscar...', 
  onSearch, 
  debounceMs = 300,
  fullWidth = true 
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoizar la función de búsqueda para evitar recreaciones
  const debouncedSearch = useCallback(
    (value: string) => {
      const timer = setTimeout(() => {
        onSearch(value)
      }, debounceMs)
      return () => clearTimeout(timer)
    },
    [onSearch, debounceMs]
  )

  useEffect(() => {
    if (!mounted) return
    const cleanup = debouncedSearch(searchTerm)
    return cleanup
  }, [searchTerm, debouncedSearch, mounted])

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth={fullWidth}
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
                aria-label="limpiar búsqueda"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        variant="outlined"
        size="small"
      />
    </Box>
  )
}

