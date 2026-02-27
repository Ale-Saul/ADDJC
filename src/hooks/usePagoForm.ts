import { useReducer, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PagoCreate, TipoPago, TipoDescuento, RazonDescuento, EstadoPago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { TIPO_PAGO, ESTADO_PAGO, TIPO_DESCUENTO, RAZON_DESCUENTO } from '@/constants/pagos'

type State = {
  formData: PagoCreate
  loading: boolean
  error: string | null
  success: boolean
}

type Action =
  | { type: 'SET_FIELD'; field: keyof PagoCreate; value: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: boolean }
  | { type: 'RESET_DISCOUNT' }
  | { type: 'INIT_DISCOUNT' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, formData: { ...state.formData, [action.field]: action.value }, error: null, success: false }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_SUCCESS': return { ...state, success: action.payload }
    case 'RESET_DISCOUNT': return {
      ...state,
      formData: {
        ...state.formData,
        tipo_descuento: TIPO_DESCUENTO.NINGUNO as TipoDescuento,
        descuento_porcentaje: null,
        descuento_monto: null,
        razon_descuento: RAZON_DESCUENTO.NINGUNO as RazonDescuento
      }
    }
    case 'INIT_DISCOUNT': return {
      ...state,
      formData: {
        ...state.formData,
        tipo_descuento: TIPO_DESCUENTO.PORCENTAJE as TipoDescuento,
        razon_descuento: RAZON_DESCUENTO.BECA as RazonDescuento
      }
    }
    default: return state
  }
}

export function usePagoForm({ judokaId, onSuccess }: { judokaId: string, onSuccess?: () => void }) {
  const { user } = useAuth()
  
  const [state, dispatch] = useReducer(reducer, {
    formData: {
      judoka_id: judokaId,
      club_id: user?.club_id || '',
      tipo_pago: TIPO_PAGO.MENSUALIDAD as TipoPago,
      concepto: '',
      descripcion: null,
      monto_base: '' as any,
      tiene_descuento: false,
      tipo_descuento: TIPO_DESCUENTO.NINGUNO as TipoDescuento,
      descuento_porcentaje: null,
      descuento_monto: null,
      razon_descuento: RAZON_DESCUENTO.NINGUNO as RazonDescuento,
      estado: ESTADO_PAGO.PENDIENTE as EstadoPago,
      fecha_vencimiento: '',
      fecha_pago: null,
      metodo_pago: null,
      comprobante_url: null,
      creador_id: user?.id || '',
      activo: true
    },
    loading: false,
    error: null,
    success: false
  })

  const montoFinal = useMemo(() => {
    const montoBase = typeof state.formData.monto_base === 'string' ? parseFloat(state.formData.monto_base) || 0 : state.formData.monto_base
    let final = montoBase

    if (state.formData.tiene_descuento) {
      if (state.formData.tipo_descuento === TIPO_DESCUENTO.PORCENTAJE && state.formData.descuento_porcentaje) {
        final = montoBase - (montoBase * state.formData.descuento_porcentaje / 100)
      } else if (state.formData.tipo_descuento === TIPO_DESCUENTO.MONTO_FIJO && state.formData.descuento_monto) {
        final = montoBase - state.formData.descuento_monto
      }
    }
    return Math.max(0, final)
  }, [state.formData.monto_base, state.formData.tiene_descuento, state.formData.tipo_descuento, state.formData.descuento_porcentaje, state.formData.descuento_monto])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const response = await pagoController.createPago({
        ...state.formData,
        monto_final: montoFinal
      })

      if (response.success) {
        dispatch({ type: 'SET_SUCCESS', payload: true })
        if (onSuccess) setTimeout(() => onSuccess(), 1500)
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al crear el pago' })
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Error inesperado al crear el pago' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return { state, dispatch, montoFinal, handleSubmit }
}
