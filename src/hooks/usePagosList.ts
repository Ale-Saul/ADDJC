import { useReducer, useCallback, useEffect, useState } from 'react'
import { Pago } from '@/models/pago'
import { pagoController } from '@/controllers/pagoController'
import { ESTADO_PAGO } from '@/constants/pagos'

interface PagosListState {
  pagos: Pago[]
  loading: boolean
  deleting: string | null
  fetchError: string | null
  deleteError: string | null
}

type PagosListAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Pago[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'DELETE_START'; payload: string }
  | { type: 'DELETE_SUCCESS'; payload: string }
  | { type: 'DELETE_ERROR'; payload: string }
  | { type: 'CLEAR_DELETE_ERROR' }

function pagosListReducer(state: PagosListState, action: PagosListAction): PagosListState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, fetchError: null }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, pagos: action.payload }
    case 'FETCH_ERROR':
      return { ...state, loading: false, fetchError: action.payload }
    case 'DELETE_START':
      return { ...state, deleting: action.payload, deleteError: null }
    case 'DELETE_SUCCESS':
      return {
        ...state,
        deleting: null,
        pagos: state.pagos.filter(p => p.id !== action.payload)
      }
    case 'DELETE_ERROR':
      return { ...state, deleting: null, deleteError: action.payload }
    case 'CLEAR_DELETE_ERROR':
      return { ...state, deleteError: null }
    default:
      return state
  }
}

export function usePagosList(judokaId: string, onPagoDeleted?: () => void) {
  const [state, dispatch] = useReducer(pagosListReducer, {
    pagos: [],
    loading: true,
    deleting: null,
    fetchError: null,
    deleteError: null,
  })
  const [pagoToDelete, setPagoToDelete] = useState<Pago | null>(null)

  const fetchPagos = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const response = await pagoController.getPagosByJudoka(judokaId)
      if (response.success && response.data) {
        const pagosPendientes = response.data.filter(
          p => p.estado === ESTADO_PAGO.PENDIENTE || p.estado === ESTADO_PAGO.VENCIDO
        )
        dispatch({ type: 'FETCH_SUCCESS', payload: pagosPendientes })
      } else {
        dispatch({ type: 'FETCH_ERROR', payload: response.error || 'Error al cargar pagos' })
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error)
      dispatch({ type: 'FETCH_ERROR', payload: 'Error inesperado al cargar pagos' })
    }
  }, [judokaId])

  useEffect(() => {
    fetchPagos()
  }, [fetchPagos])

  const requestDelete = useCallback((pago: Pago) => {
    setPagoToDelete(pago)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!pagoToDelete) return
    const id = pagoToDelete.id
    setPagoToDelete(null)
    dispatch({ type: 'DELETE_START', payload: id })
    try {
      const response = await pagoController.deletePago(id)
      if (response.success) {
        dispatch({ type: 'DELETE_SUCCESS', payload: id })
        onPagoDeleted?.()
      } else {
        dispatch({ type: 'DELETE_ERROR', payload: response.error || 'Error al eliminar el pago' })
      }
    } catch (error) {
      console.error('Error al eliminar pago:', error)
      dispatch({ type: 'DELETE_ERROR', payload: 'Error inesperado al eliminar el pago' })
    }
  }, [pagoToDelete, onPagoDeleted])

  const cancelDelete = useCallback(() => {
    setPagoToDelete(null)
  }, [])

  const clearDeleteError = useCallback(() => {
    dispatch({ type: 'CLEAR_DELETE_ERROR' })
  }, [])

  return {
    ...state,
    pagoToDelete,
    fetchPagos,
    requestDelete,
    confirmDelete,
    cancelDelete,
    clearDeleteError,
  }
}

