'use client'

import React from 'react'
import { Controller, Control } from 'react-hook-form'
import { Autocomplete, TextField } from '@mui/material'

export type Option = {
  value: string | number
  label: string
}

export type FormAutocompleteProps = {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  options: Option[]
  label?: string
  fullWidth?: boolean
  helperText?: string
  disabled?: boolean
  required?: boolean
}

export function FormAutocomplete({
  name,
  control,
  options,
  label,
  fullWidth = true,
  helperText,
  disabled = false,
  required = false,
}: FormAutocompleteProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
        const selectedOption = options.find((opt) => opt.value === value) || null

        return (
          <Autocomplete
            options={options}
            getOptionLabel={(option) => option.label}
            value={selectedOption}
            onChange={(_, newValue) => {
              onChange(newValue ? newValue.value : '')
            }}
            fullWidth={fullWidth}
            disabled={disabled}
            noOptionsText="Sin opciones"
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label={label}
                required={required}
                error={!!error}
                helperText={error ? error.message : helperText}
              />
            )}
            isOptionEqualToValue={(option, val) => option.value === val.value}
          />
        )
      }}
    />
  )
}
