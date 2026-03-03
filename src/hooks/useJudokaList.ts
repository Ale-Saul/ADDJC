import { useReducer, useCallback, useMemo, useEffect } from 'react'
import { Judoka } from '@/models/judoka'
import { judokaController } from '@/controllers/judokaController'

interface JudokaState {
  judokas: Judoka[]
  loading: boolean
  error: string | null
  modifiedIds: Set<string>
}

type JudokaAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Judoka[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'TOGGLE_STATUS_START'; payload: string; isActive: boolean }
  | { type: 'TOGGLE_STATUS_SUCCESS'; payload: string }
  | { type: 'TOGGLE_STATUS_ERROR'; payload: string; isActive: boolean }
  | { type: 'SET_JUDOKAS'; payload: Judoka[] }

function judokaReducer(state: JudokaState, action: JudokaAction): JudokaState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, judokas: action.payload, modifiedIds: new Set() }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload }
    case 'TOGGLE_STATUS_START':
      return {
        ...state,
        modifiedIds: new Set(state.modifiedIds).add(action.payload),
        judokas: state.judokas.map((j) =>
          j.id === action.payload ? { ...j, activo: !action.isActive } : j
        ),
      }
    case 'TOGGLE_STATUS_SUCCESS':
      return { ...state } // We keep it in modifiedIds for session sorting if needed, or we could remove it
    case 'TOGGLE_STATUS_ERROR':
      return {
        ...state,
        modifiedIds: (() => {
          const next = new Set(state.modifiedIds)
          next.delete(action.payload)
          return next
        })(),
        judokas: state.judokas.map((j) =>
          j.id === action.payload ? { ...j, activo: action.isActive } : j
        ),
      }
    case 'SET_JUDOKAS':
      return { ...state, judokas: action.payload, loading: false }
    default:
      return state
  }
}

export function useJudokaList(options: {
  clubId?: string
  entrenadorId?: string
  refreshTrigger?: number
  judokasProp?: Judoka[]
}) {
  const [state, dispatch] = useReducer(judokaReducer, {
    judokas: [],
    loading: true,
    error: null,
    modifiedIds: new Set(),
  })

  const loadJudokas = useCallback(async () => {
    if (options.judokasProp) {
      dispatch({ type: 'SET_JUDOKAS', payload: options.judokasProp })
      return
    }

    dispatch({ type: 'FETCH_START' })
    try {
      let response
      if (options.clubId) {
        response = await judokaController.getJudokasByClub(options.clubId)
      } else if (options.entrenadorId) {
        response = await judokaController.getJudokasByEntrenador(options.entrenadorId)
      } else {
        response = await judokaController.getAllJudokas(true)
      }

      if (response.success && response.data) {
        dispatch({ type: 'FETCH_SUCCESS', payload: response.data })
      } else {
        dispatch({ type: 'FETCH_ERROR', payload: response.error || 'Error al cargar los judokas' })
      }
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Error inesperado al cargar los judokas' })
    }
  }, [options.clubId, options.entrenadorId, options.judokasProp])

  useEffect(() => {
    loadJudokas()
  }, [loadJudokas, options.refreshTrigger])

  const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    dispatch({ type: 'TOGGLE_STATUS_START', payload: id, isActive: currentStatus })
    try {
      const response = await judokaController.updateJudoka(id, { activo: !currentStatus })
      if (response.success) {
        dispatch({ type: 'TOGGLE_STATUS_SUCCESS', payload: id })
      } else {
        dispatch({ type: 'TOGGLE_STATUS_ERROR', payload: id, isActive: currentStatus })
        alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
      }
    } catch (err) {
      dispatch({ type: 'TOGGLE_STATUS_ERROR', payload: id, isActive: currentStatus })
      alert('Error inesperado al cambiar el estado')
    }
  }, [])

  return {
    ...state,
    loadJudokas,
    toggleStatus,
  }
}
