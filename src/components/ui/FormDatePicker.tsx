'use client'

import React from 'react'
import { Controller, Control } from 'react-hook-form'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

export type FormDatePickerProps = {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  label: string
  disabled?: boolean
  fullWidth?: boolean
  maxDate?: dayjs.Dayjs
}

export function FormDatePicker({ name, control, label, disabled, fullWidth = true, maxDate }: FormDatePickerProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <DatePicker
            label={label}
            disabled={disabled}
            maxDate={maxDate}
            value={field.value ? dayjs(field.value) : null}
            onChange={(newValue) => {
              // Si la fecha es inválida o mayor a la máxima, no actualizar el valor del formulario
              if (!newValue || !newValue.isValid()) {
                field.onChange(null)
                return
              }
              
              if (maxDate && newValue.isAfter(maxDate)) {
                // Forzar el valor a la fecha máxima si se intenta poner una mayor
                field.onChange(maxDate.format('YYYY-MM-DD'))
                return
              }

              field.onChange(newValue.format('YYYY-MM-DD'))
            }}
            slotProps={{
              textField: {
                fullWidth,
                error: !!error,
                helperText: error?.message,
                inputProps: {
                  readOnly: true,
                },
                onClick: (e) => {
                  // Al hacer clic en el campo, abrir el calendario
                }
              },
            }}
          />
        </LocalizationProvider>
      )}
    />
  )
}
