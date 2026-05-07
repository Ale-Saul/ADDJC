'use client'

import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectProps,
  SelectChangeEvent
} from '@mui/material'

export type FilterOption = {
  value: string | number
  label: string
}

export interface FilterSelectProps extends Omit<SelectProps, 'onChange' | 'value'> {
  label?: string
  value: string | number
  onChange: (event: SelectChangeEvent<any>) => void
  options: FilterOption[]
  helperText?: string
  error?: boolean
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  helperText,
  error,
  fullWidth = true,
  ...props
}: FilterSelectProps) {
  return (
    <FormControl fullWidth={fullWidth} error={error} size="small">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value}
        onChange={onChange}
        label={label}
        {...props}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
