import { useReducer, useEffect, useCallback, useMemo } from 'react'
import { MiembroAsociacion } from '@/models/asociacion'
import { asociacionController } from '@/controllers/asociacionController'

type State = {
  miembros: MiembroAsociacion[]
  loading: boolean
  error: string | null
  globalFilter: string
  cargoFilter: string
  estadoFilter: string
  showFilters: boolean
  modifiedIds: Set<string>
}

type Action =
  | { type: 'SET_MIEMBROS'; payload: MiembroAsociacion[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_CARGO_FILTER'; payload: string }
  | { type: 'SET_ESTADO_FILTER'; payload: string }
  | { type: 'TOGGLE_SHOW_FILTERS' }
  | { type: 'CLEAR_FILTERS'; initialSearch: string }
  | { type: 'UPDATE_MIEMBRO_STATUS'; id: string; activo: boolean }
  | { type: 'ADD_MODIFIED_ID'; id: string }
  | { type: 'REMOVE_MODIFIED_ID'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MIEMBROS': return { ...state, miembros: action.payload, modifiedIds: new Set() }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_GLOBAL_FILTER': return { ...state, globalFilter: action.payload }
    case 'SET_CARGO_FILTER': return { ...state, cargoFilter: action.payload }
    case 'SET_ESTADO_FILTER': return { ...state, estadoFilter: action.payload }
    case 'TOGGLE_SHOW_FILTERS': return { ...state, showFilters: !state.showFilters }
    case 'CLEAR_FILTERS': return { 
      ...state, 
      cargoFilter: 'all', 
      estadoFilter: 'all', 
      globalFilter: action.initialSearch, 
      modifiedIds: new Set() 
    }
    case 'UPDATE_MIEMBRO_STATUS': return {
      ...state,
      miembros: state.miembros.map(m => m.id === action.id ? { ...m, activo: action.activo } : m)
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

export function useMiembroAsociacionList(initialSearch: string = '') {
  const [state, dispatch] = useReducer(reducer, {
    miembros: [],
    loading: true,
    error: null,
    globalFilter: initialSearch,
    cargoFilter: 'all',
    estadoFilter: 'all',
    showFilters: false,
    modifiedIds: new Set()
  })

  const loadMiembros = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const response = await asociacionController.getAllMiembros(true)
      if (response.success && response.data) {
        dispatch({ type: 'SET_MIEMBROS', payload: response.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al cargar los miembros' })
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Error inesperado al cargar los miembros' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    dispatch({ type: 'ADD_MODIFIED_ID', id })
    dispatch({ type: 'UPDATE_MIEMBRO_STATUS', id, activo: !currentStatus })
    
    try {
      const response = await asociacionController.updateMiembro(id, { activo: !currentStatus } as any)
      if (!response.success) {
        dispatch({ type: 'UPDATE_MIEMBRO_STATUS', id, activo: currentStatus })
        dispatch({ type: 'REMOVE_MODIFIED_ID', id })
        alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
      }
    } catch (err) {
      dispatch({ type: 'UPDATE_MIEMBRO_STATUS', id, activo: currentStatus })
      dispatch({ type: 'REMOVE_MODIFIED_ID', id })
      console.error(err)
      alert('Error inesperado al cambiar el estado')
    }
  }, [])

  const filteredData = useMemo(() => {
    const filtered = state.miembros.filter(m => {
      const matchCargo = state.cargoFilter === 'all' || m.cargo === state.cargoFilter
      const matchEstado = state.estadoFilter === 'all' || (state.estadoFilter === 'activo' ? m.activo : !m.activo)
      const search = state.globalFilter.toLowerCase()
      const matchSearch = !search || 
        m.nombres?.toLowerCase().includes(search) ||
        m.apellidos?.toLowerCase().includes(search) ||
        m.ci?.toLowerCase().includes(search) ||
        m.cargo?.toLowerCase().includes(search)
      return matchCargo && matchEstado && matchSearch
    })

    return [...filtered].sort((a, b) => {
      const isAModified = state.modifiedIds.has(a.id)
      const isBModified = state.modifiedIds.has(b.id)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo
      if (effectiveAActive === effectiveBActive) return 0
      return effectiveAActive ? -1 : 1
    })
  }, [state.miembros, state.cargoFilter, state.estadoFilter, state.globalFilter, state.modifiedIds])

  return { state, dispatch, loadMiembros, toggleStatus, filteredData }
}
