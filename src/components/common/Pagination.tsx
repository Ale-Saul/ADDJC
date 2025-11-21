'use client'

import { Box, Pagination as MuiPagination, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50, 100]
}: PaginationProps) {
  // Mostrar siempre si hay items
  if (totalItems === 0) return null

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handleItemsPerPageChange = (event: any) => {
    const newItemsPerPage = event.target.value
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage)
      // Resetear a página 1 cuando cambia la cantidad de items por página
      onPageChange(1)
    }
  }

  return (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center" 
      mt={3}
      flexWrap="wrap"
      gap={2}
    >
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          Mostrando {startItem} - {endItem} de {totalItems} resultados
        </Typography>
        {onItemsPerPageChange && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Por página</InputLabel>
            <Select
              value={itemsPerPage}
              label="Por página"
              onChange={handleItemsPerPageChange}
            >
              {itemsPerPageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      {totalPages > 1 && (
        <MuiPagination
          count={totalPages}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
          color="primary"
          showFirstButton
          showLastButton
        />
      )}
    </Box>
  )
}

