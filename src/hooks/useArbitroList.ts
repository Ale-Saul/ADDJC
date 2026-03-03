import { useReducer, useEffect, useCallback, useMemo } from 'react'
import { Arbitro } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'

type State = {
  arbitros: Arbitro[]
  loading: boolean
  error: string | null
  globalFilter: string
  nivelFilter: string
  estadoFilter: string
  showFilters: boolean
  modifiedIds: Set<string>
}

type Action =
  | { type: 'SET_ARBITROS'; payload: Arbitro[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_NIVEL_FILTER'; payload: string }
  | { type: 'SET_ESTADO_FILTER'; payload: string }
  | { type: 'TOGGLE_SHOW_FILTERS' }
  | { type: 'CLEAR_FILTERS'; initialSearch: string }
  | { type: 'UPDATE_ARBITRO_STATUS'; id: string; activo: boolean }
  | { type: 'ADD_MODIFIED_ID'; id: string }
  | { type: 'REMOVE_MODIFIED_ID'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ARBITROS': return { ...state, arbitros: action.payload, modifiedIds: new Set() }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_GLOBAL_FILTER': return { ...state, globalFilter: action.payload }
    case 'SET_NIVEL_FILTER': return { ...state, nivelFilter: action.payload }
    case 'SET_ESTADO_FILTER': return { ...state, estadoFilter: action.payload }
    case 'TOGGLE_SHOW_FILTERS': return { ...state, showFilters: !state.showFilters }
    case 'CLEAR_FILTERS': return { 
      ...state, 
      nivelFilter: 'all', 
      estadoFilter: 'all', 
      globalFilter: action.initialSearch, 
      modifiedIds: new Set() 
    }
    case 'UPDATE_ARBITRO_STATUS': return {
      ...state,
      arbitros: state.arbitros.map(a => a.id === action.id ? { ...a, activo: action.activo } : a)
    }
    case 'ADD_MODIFIED_ID': {
      const next = new Set(state.modifiedIds)
      next.add(action.id)
      return { ...state, modifiedIds: next }
    }
    case 'REMOVE_MODIFIED_ID': {
      const next = new Set(state.modifiedIds)
      next.delete(action.id)
      return { ...state, modifiedIds: next }
    }
    default: return state
  }
}

export function useArbitroList(initialSearch: string = '') {
  const [state, dispatch] = useReducer(reducer, {
    arbitros: [],
    loading: true,
    error: null,
    globalFilter: initialSearch,
    nivelFilter: 'all',
    estadoFilter: 'all',
    showFilters: false,
    modifiedIds: new Set()
  })

  const loadArbitros = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const response = await arbitroController.getAllArbitros(true)
      if (response.success && response.data) {
        dispatch({ type: 'SET_ARBITROS', payload: response.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al cargar los árbitros' })
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Error inesperado al cargar los árbitros' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    dispatch({ type: 'ADD_MODIFIED_ID', id })
    dispatch({ type: 'UPDATE_ARBITRO_STATUS', id, activo: !currentStatus })
    
    try {
      const response = await arbitroController.updateArbitro(id, { activo: !currentStatus })
      if (!response.success) {
        dispatch({ type: 'UPDATE_ARBITRO_STATUS', id, activo: currentStatus })
        dispatch({ type: 'REMOVE_MODIFIED_ID', id })
        alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
      }
    } catch (err) {
      dispatch({ type: 'UPDATE_ARBITRO_STATUS', id, activo: currentStatus })
      dispatch({ type: 'REMOVE_MODIFIED_ID', id })
      console.error(err)
      alert('Error inesperado al cambiar el estado')
    }
  }, [])

  const filteredData = useMemo(() => {
    const filtered = state.arbitros.filter(a => {
      const matchNivel = state.nivelFilter === 'all' || a.nivel_arbitraje === state.nivelFilter
      const matchEstado = state.estadoFilter === 'all' || (state.estadoFilter === 'activo' ? a.activo : !a.activo)
      const search = state.globalFilter.toLowerCase()
      const matchSearch = !search || 
        a.nombres?.toLowerCase().includes(search) ||
        a.apellidos?.toLowerCase().includes(search) ||
        a.ci?.toLowerCase().includes(search) ||
        a.nivel_arbitraje?.toLowerCase().includes(search)
      return matchNivel && matchEstado && matchSearch
    })

    return [...filtered].sort((a, b) => {
      const isAModified = state.modifiedIds.has(a.id)
      const isBModified = state.modifiedIds.has(b.id)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo
      if (effectiveAActive === effectiveBActive) return 0
      return effectiveAActive ? -1 : 1
    })
  }, [state.arbitros, state.nivelFilter, state.estadoFilter, state.globalFilter, state.modifiedIds])

  return { state, dispatch, loadArbitros, toggleStatus, filteredData }
}
