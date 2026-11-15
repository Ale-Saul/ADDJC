'use client'

import {
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  InputAdornment,
  Stack,
  Divider,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { Judoka } from '@/models/judoka'
import { useWatch } from 'react-hook-form'
import { FormInput, FormDatePicker, FormAutocomplete } from '@/components/ui'
import { formatNameWithNumbersInput } from '@/utils/formatters'
import {
  TIPO_PAGO,
  TIPO_PAGO_LABELS,
  TIPO_DESCUENTO,
  RAZON_DESCUENTO,
  RAZON_DESCUENTO_LABELS,
  MONTO_MENSUALIDAD_DEFAULT,
} from '@/constants/pagos'
import { usePagoMasivoManager } from '@/hooks/usePagoMasivoManager'

const TIPO_PAGO_OPTIONS = Object.entries(TIPO_PAGO_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

const RAZON_DESCUENTO_OPTIONS = Object.entries(RAZON_DESCUENTO_LABELS)
  .filter(([value]) => value !== 'ninguno')
  .map(([value, label]) => ({ value, label }))

interface PagoMasivoFormProps {
  judokas: Judoka[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PagoMasivoForm({ judokas, onSuccess, onCancel }: PagoMasivoFormProps) {
  const {
    form,
    montoFinal,
    loading,
    error,
    success,
    createdCount,
    onSubmit,
    setError,
  } = usePagoMasivoManager({ judokas, onSuccess })

  const watchTipoPago = useWatch({ control: form.control, name: 'tipo_pago' })
  const watchMontoBase = useWatch({ control: form.control, name: 'monto_base' })
  const watchTieneDescuento = useWatch({ control: form.control, name: 'tiene_descuento' })
  const watchTipoDescuento = useWatch({ control: form.control, name: 'tipo_descuento' })
  const watchDescuentoMonto = useWatch({ control: form.control, name: 'descuento_monto' })

  const esMensualidad = watchTipoPago === TIPO_PAGO.MENSUALIDAD
  const montoBaseNum = Number(watchMontoBase) || 0
  const ahorroTotal = Math.max(0, montoBaseNum - montoFinal)

  const aplicarDescuentoRapido = (monto: number) => {
    form.setValue('tiene_descuento', true)
    form.setValue('tipo_descuento', TIPO_DESCUENTO.MONTO_FIJO)
    form.setValue('descuento_monto', monto, { shouldValidate: true })
    form.setValue('descuento_porcentaje', null)
    if (!form.getValues('razon_descuento') || form.getValues('razon_descuento') === 'ninguno') {
      form.setValue('razon_descuento', RAZON_DESCUENTO.PROMOCION)
    }
  }

  return (
    <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        Crear pago para <strong>{judokas.length} futbolistas</strong> seleccionados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {createdCount} pagos creados exitosamente
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Creando pagos... {createdCount} de {judokas.length}
        </Alert>
      )}

      <Stack spacing={3}>
        <FormAutocomplete
          control={form.control}
          name="tipo_pago"
          label="Tipo de Pago"
          options={TIPO_PAGO_OPTIONS}
          disabled={loading}
          required
          onChange={(_, val) => {
            const v = (val as any)?.value
            form.setValue('tipo_pago', v)
            if (v === TIPO_PAGO.MENSUALIDAD) {
              form.setValue('monto_base', MONTO_MENSUALIDAD_DEFAULT, { shouldValidate: true })
            }
          }}
        />

        <FormInput
          control={form.control}
          name="concepto"
          label="Concepto"
          disabled={loading}
          required
          formatValue={formatNameWithNumbersInput}
        />

        <FormInput
          control={form.control}
          name="descripcion"
          label="Descripción (opcional)"
          multiline
          rows={2}
          disabled={loading}
          formatValue={formatNameWithNumbersInput}
        />

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <FormInput
            control={form.control}
            name="monto_base"
            label="Monto Base"
            type="number"
            disabled={loading}
            required
            helperText={esMensualidad ? 'Monto fijo mensualidad: Bs. 140' : undefined}
            InputProps={{
              startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
            }}
          />

          <FormDatePicker
            control={form.control}
            name="fecha_vencimiento"
            label="Fecha de Vencimiento"
            disabled={loading}
          />
        </Box>

        <Divider />

        {/* Sección de Descuento Masivo Simplificada */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: watchTieneDescuento ? 'primary.main' : 'divider',
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Descuento General para Todos
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={watchTieneDescuento ? (watchTipoDescuento || TIPO_DESCUENTO.MONTO_FIJO) : 'ninguno'}
                onChange={(_, val) => {
                  if (!val || val === 'ninguno') {
                    form.setValue('tiene_descuento', false)
                    form.setValue('tipo_descuento', TIPO_DESCUENTO.NINGUNO)
                    form.setValue('descuento_monto', null)
                    form.setValue('descuento_porcentaje', null)
                  } else {
                    form.setValue('tiene_descuento', true)
                    form.setValue('tipo_descuento', val)
                    if (!form.getValues('razon_descuento') || form.getValues('razon_descuento') === 'ninguno') {
                      form.setValue('razon_descuento', RAZON_DESCUENTO.PROMOCION)
                    }
                  }
                }}
              >
                <ToggleButton value="ninguno" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                  Sin descuento
                </ToggleButton>
                <ToggleButton value={TIPO_DESCUENTO.MONTO_FIJO} sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                  Descuento en Bs.
                </ToggleButton>
                <ToggleButton value={TIPO_DESCUENTO.PORCENTAJE} sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                  Descuento en %
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {watchTieneDescuento && (
              <Stack spacing={2}>
                {watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Atajos rápidos:
                    </Typography>
                    {[20, 40, 70].map((montoDesc) => {
                      const activo = watchDescuentoMonto === montoDesc
                      return (
                        <Chip
                          key={montoDesc}
                          label={`-Bs. ${montoDesc} (Paga Bs. ${montoBaseNum - montoDesc})`}
                          size="small"
                          clickable
                          color={activo ? 'primary' : 'default'}
                          variant={activo ? 'filled' : 'outlined'}
                          onClick={() => aplicarDescuentoRapido(montoDesc)}
                        />
                      )
                    })}
                  </Stack>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  {watchTipoDescuento === TIPO_DESCUENTO.MONTO_FIJO ? (
                    <FormInput
                      control={form.control}
                      name="descuento_monto"
                      label="Monto de Descuento"
                      type="number"
                      disabled={loading}
                      placeholder="Ej: 20"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                      }}
                    />
                  ) : (
                    <FormInput
                      control={form.control}
                      name="descuento_porcentaje"
                      label="Porcentaje de Descuento"
                      type="number"
                      disabled={loading}
                      placeholder="Ej: 20"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  )}

                  <FormAutocomplete
                    control={form.control}
                    name="razon_descuento"
                    label="Motivo del Descuento"
                    options={RAZON_DESCUENTO_OPTIONS}
                    disabled={loading}
                  />
                </Box>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Resumen Final */}
        <Box
          sx={{
            p: 2,
            bgcolor: watchTieneDescuento && ahorroTotal > 0 ? 'success.50' : 'primary.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: watchTieneDescuento && ahorroTotal > 0 ? 'success.main' : 'primary.main',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Por futbolista: Monto Base Bs. {montoBaseNum.toFixed(2)}
                {watchTieneDescuento && ahorroTotal > 0 && (
                  <span style={{ color: '#d32f2f', fontWeight: 600, marginLeft: 8 }}>
                    (-Bs. {ahorroTotal.toFixed(2)} desc.)
                  </span>
                )}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                Total por futbolista: Bs. {montoFinal.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total proyectado ({judokas.length} futbolistas): Bs. {(montoFinal * judokas.length).toFixed(2)}
              </Typography>
            </Box>
            {esMensualidad && (
              <Chip label="Cuota Fija: Bs. 140" size="small" color="primary" variant="outlined" />
            )}
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || judokas.length === 0}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Creando Pagos...' : `Crear ${judokas.length} Pagos`}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
