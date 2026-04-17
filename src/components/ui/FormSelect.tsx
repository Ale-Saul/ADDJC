'use client'

import React from 'react'
import { Controller, Control } from 'react-hook-form'
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  SelectProps
} from '@mui/material'

export type Option = {
  value: string | number
  label: string
}

export type FormSelectProps = {
  helperText?: string;
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  options: Option[]
  label?: string
} & Omit<SelectProps, 'name' | 'label'>

export function FormSelect({ name, control, options, label, fullWidth = true, helperText, ...props }: FormSelectProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth={fullWidth} error={!!error} sx={props.sx}>
          {label && <InputLabel>{label}</InputLabel>}
          <Select
            {...field}
            {...props}
            label={label}
            value={field.value !== undefined && field.value !== null ? field.value : ''}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {(error || helperText) && (
            <FormHelperText>{error ? error.message : helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
