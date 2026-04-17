'use client'

import React from 'react'
import { Controller, Control } from 'react-hook-form'
import { TextField, TextFieldProps } from '@mui/material'

export type FormInputProps = {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  formatValue?: (value: string) => string
} & Omit<TextFieldProps, 'name'>

export function FormInput({ name, control, formatValue, fullWidth = true, onBlur: externalOnBlur, ...props }: FormInputProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          fullWidth={fullWidth}
          {...field}
          {...props}
          value={field.value ?? ''}
          onChange={(e) => {
            const rawValue = e.target.value
            const val = formatValue ? formatValue(rawValue) : rawValue
            field.onChange(val)
            if (props.onChange) props.onChange(e as any)
          }}
          onBlur={(e) => {
            field.onBlur()
            if (externalOnBlur) externalOnBlur(e as any)
          }}
          error={!!error}
          helperText={error ? error.message : props.helperText}
        />
      )}
    />
  )
}
