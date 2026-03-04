import { useReducer, useCallback, useEffect } from 'react'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { ESTADO_PAGO } from '@/constants/pagos'

interface PagosListState {
  pagos: Pago[]
  loading: boolean
  deleting: string | null
}

type PagosListAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Pago[] }
  | { type: 'DELETE_START'; payload: string }
  | { type: 'DELETE_SUCCESS'; payload: string }
  | { type: 'DELETE_ERROR' }

function pagosListReducer(state: PagosListState, action: PagosListAction): PagosListState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, pagos: action.payload }
    case 'DELETE_START':
      return { ...state, deleting: action.payload }
    case 'DELETE_SUCCESS':
      return { 
        ...state, 
        deleting: null, 
        pagos: state.pagos.filter(p => p.id !== action.payload) 
      }
    case 'DELETE_ERROR':
      return { ...state, deleting: null }
    default:
      return state
  }
}

export function usePagosList(judokaId: string, onPagoDeleted?: () => void) {
  const [state, dispatch] = useReducer(pagosListReducer, {
    pagos: [],
    loading: true,
    deleting: null
  })

  const fetchPagos = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const response = await pagoController.getPagosByJudoka(judokaId)
      if (response.success && response.data) {
        const pagosPendientes = response.data.filter(
          p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO
        )
        dispatch({ type: 'FETCH_SUCCESS', payload: pagosPendientes })
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error)
    }
  }, [judokaId])

  useEffect(() => {
    fetchPagos()
  }, [fetchPagos])

  const deletePago = useCallback(async (pago: Pago) => {
    if (!confirm(`¿Estás seguro de eliminar el pago "${pago.concepto}"?`)) return

    dispatch({ type: 'DELETE_START', payload: pago.id })
    try {
      const response = await pagoController.deletePago(pago.id)
      if (response.success) {
        dispatch({ type: 'DELETE_SUCCESS', payload: pago.id })
        onPagoDeleted?.()
      } else {
        alert(`Error al eliminar: ${response.error}`)
        dispatch({ type: 'DELETE_ERROR' })
      }
    } catch (error) {
      console.error('Error al eliminar pago:', error)
      alert('Error inesperado al eliminar el pago')
      dispatch({ type: 'DELETE_ERROR' })
    }
  }, [onPagoDeleted])

  return {
    ...state,
    fetchPagos,
    deletePago
  }
}
