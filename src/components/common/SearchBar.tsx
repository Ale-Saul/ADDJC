'use client'

import { useState, useSyncExternalStore, useEffect, useCallback } from 'react'
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

const emptySubscribe = () => () => {}
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export default function SearchBar({ 
  placeholder = 'Buscar...', 
  onSearch, 
  debounceMs = 300,
  fullWidth = true 
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const isClient = useIsClient()

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
    if (!isClient) return
    const cleanup = debouncedSearch(searchTerm)
    return cleanup
  }, [searchTerm, debouncedSearch, isClient])

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  if (!isClient) return null

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
