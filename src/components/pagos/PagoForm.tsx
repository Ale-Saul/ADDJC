'use client'

import { useState } from 'react'
import {
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  InputAdornment,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material'
import { useWatch } from 'react-hook-form'
import { formatNameWithNumbersInput } from '@/utils/formatters'
import { FormInput, FormDatePicker, FormAutocomplete } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { usePagoCreateForm } from '@/hooks/usePagoCreateForm'
import {
  TIPO_PAGO,
  TIPO_PAGO_LABELS,
  TIPO_DESCUENTO,
  RAZON_DESCUENTO,
  RAZON_DESCUENTO_LABELS,
  MONTO_MENSUALIDAD_DEFAULT,
  METODO_PAGO,
} from '@/constants/pagos'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import PaymentsIcon from '@mui/icons-material/Payments'

interface PagoFormProps {
  judokaId: string
  judokaNombre: string
  clubId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const TIPO_PAGO_OPTIONS = Object.entries(TIPO_PAGO_LABELS).map(([value, label]) => ({ value, label }))
const RAZON_DESCUENTO_OPTIONS = Object.entries(RAZON_DESCUENTO_LABELS)
  .filter(([value]) => value !== 'ninguno')
  .map(([value, label]) => ({ value, label }))

export default function PagoForm({ judokaId, judokaNombre, clubId, onSuccess, onCancel }: PagoFormProps) {
  const { user } = useAuth()
  const usuarioNombre = user ? `${user.nombres} ${user.apellidos}` : 'Sistema'

  const [metodoCobro, setMetodoCobro] = useState<string>(METODO_PAGO.EFECTIVO)
  const [ultimoTipoAccion, setUltimoTipoAccion] = useState<'pendiente' | 'cobrado'>('pendiente')

  const {
    form,
    montoFinal,
    loading,
    error,
    success,
    onSubmit,
    setError,
  } = usePagoCreateForm(judokaId, clubId, user?.id, onSuccess, judokaNombre, usuarioNombre)

  const watchTipoPago = useWatch({ control: form.control, name: 'tipo_pago' })
  const watchMontoBase = useWatch({ control: form.control, name: 'monto_base' })
  const watchTieneDescuento = useWatch({ control: form.control, name: 'tiene_descuento' })
  const watchTipoDescuento = useWatch({ control: form.control, name: 'tipo_descuento' })
  const watchDescuentoMonto = useWatch({ control: form.control, name: 'descuento_monto' })

  const esMensualidad = watchTipoPago === TIPO_PAGO.MENSUALIDAD

  const handleCrear = (cobrarInmediato: boolean) => async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    setUltimoTipoAccion(cobrarInmediato ? 'cobrado' : 'pendiente')
    const isValid = await form.trigger()
    if (!isValid) return

    const values = form.getValues()
    const pago = await onSubmit(values, {
      cobrarInmediato,
      metodoPago: metodoCobro,
    })

    if (pago) {
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
    }
  }

  const aplicarDescuentoRapido = (monto: number) => {
    form.setValue('tiene_descuento', true)
    form.setValue('tipo_descuento', TIPO_DESCUENTO.MONTO_FIJO)
    form.setValue('descuento_monto', monto, { shouldValidate: true })
    form.setValue('descuento_porcentaje', null)
    if (!form.getValues('razon_descuento') || form.getValues('razon_descuento') === 'ninguno') {
      form.setValue('razon_descuento', RAZON_DESCUENTO.PROMOCION)
    }
  }

  const montoBaseNum = Number(watchMontoBase) || 0
  const ahorroTotal = Math.max(0, montoBaseNum - montoFinal)

  return (
    <Box component="form" sx={{ mt: 2 }}>
      <Typography variant="subtitle1" color="text.secondary" mb={2}>
        Crear pago para: <strong>{judokaNombre}</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {ultimoTipoAccion === 'cobrado'
            ? '¡Pago y cobro registrados exitosamente! Se generó el comprobante.'
            : 'Pago creado exitosamente como pendiente.'}
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

        {/* Sección de Descuento Simplificada */}
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
                Descuento
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

        {/* Resumen del Monto a Cobrar */}
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
                Monto Base: Bs. {montoBaseNum.toFixed(2)}
                {watchTieneDescuento && ahorroTotal > 0 && (
                  <span style={{ color: '#d32f2f', fontWeight: 600, marginLeft: 8 }}>
                    (-Bs. {ahorroTotal.toFixed(2)} descuento)
                  </span>
                )}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                Total a Cobrar: Bs. {montoFinal.toFixed(2)}
              </Typography>
            </Box>
            {esMensualidad && (
              <Chip label="Cuota Fija: Bs. 140" size="small" color="primary" variant="outlined" />
            )}
          </Stack>
        </Box>

        {/* Método de Cobro Inmediato */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              Método de Pago (para cobro al instante):
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={metodoCobro}
              onChange={(_, val) => val && setMetodoCobro(val)}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                },
              }}
            >
              <ToggleButton value={METODO_PAGO.EFECTIVO}>
                💵 Efectivo
              </ToggleButton>
              <ToggleButton value={METODO_PAGO.QR}>
                📱 QR / Billetera
              </ToggleButton>
              <ToggleButton value={METODO_PAGO.TRANSFERENCIA}>
                🏦 Transferencia
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        <Divider />

        {/* Botones de Acción */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              sx={{ minHeight: '44px' }}
            >
              Cancelar
            </Button>
          )}

          {/* Botón 1: Crear como Pendiente */}
          <Button
            type="button"
            variant="outlined"
            color="primary"
            disabled={loading}
            onClick={handleCrear(false)}
            startIcon={<ScheduleIcon />}
            sx={{ minHeight: '44px', fontWeight: 600 }}
          >
            {loading && ultimoTipoAccion === 'pendiente' ? 'Guardando…' : 'Crear como Pendiente'}
          </Button>

          {/* Botón 2: Crear y Cobrar al Instante */}
          <Button
            type="button"
            variant="contained"
            color="success"
            disabled={loading}
            onClick={handleCrear(true)}
            startIcon={
              loading && ultimoTipoAccion === 'cobrado' ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              minHeight: '44px',
              fontWeight: 700,
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' },
              boxShadow: 2,
            }}
          >
            {loading && ultimoTipoAccion === 'cobrado'
              ? 'Procesando Cobro…'
              : `Crear y Cobrar Ahora (Bs. ${montoFinal.toFixed(2)})`}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
