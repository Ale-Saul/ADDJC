'use client'

import React from 'react'
import { Controller, Control } from 'react-hook-form'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'

// Asegurar que el idioma esté cargado y configurado
import 'dayjs/locale/es'
dayjs.locale('es')

export type FormDatePickerProps = {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  label: string
  disabled?: boolean
  fullWidth?: boolean
  maxDate?: dayjs.Dayjs
  onChangeCustom?: (value: string | null) => void
}

export function FormDatePicker({ name, control, label, disabled, fullWidth = true, maxDate, onChangeCustom }: FormDatePickerProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DatePicker
          label={label}
          disabled={disabled}
          maxDate={maxDate}
          value={field.value ? dayjs(field.value) : null}
          onChange={(newValue) => {
              // Si la fecha es inválida o mayor a la máxima, no actualizar el valor del formulario
              if (!newValue || !newValue.isValid()) {
                field.onChange(null)
                if (onChangeCustom) onChangeCustom(null)
                return
              }
              
              const formattedDate = newValue.format('YYYY-MM-DD')

              if (maxDate && newValue.isAfter(maxDate)) {
                // Forzar el valor a la fecha máxima si se intenta poner una mayor
                const maxFormatted = maxDate.format('YYYY-MM-DD')
                field.onChange(maxFormatted)
                if (onChangeCustom) onChangeCustom(maxFormatted)
                return
              }

              field.onChange(formattedDate)
              if (onChangeCustom) onChangeCustom(formattedDate)
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
      )}
    />
  )
}
