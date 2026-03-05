import { useReducer, useEffect, useCallback, useMemo } from 'react'
import { Sensei } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'

type State = {
  senseis: Sensei[]
  loading: boolean
  error: string | null
  globalFilter: string
  especialidadFilter: string
  estadoFilter: string
  showFilters: boolean
  modifiedIds: Set<string>
}

type Action =
  | { type: 'SET_SENSEIS'; payload: Sensei[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_ESPECIALIDAD_FILTER'; payload: string }
  | { type: 'SET_ESTADO_FILTER'; payload: string }
  | { type: 'TOGGLE_SHOW_FILTERS' }
  | { type: 'CLEAR_FILTERS'; initialSearch: string }
  | { type: 'UPDATE_SENSEI_STATUS'; id: string; activo: boolean }
  | { type: 'UPDATE_SENSEI_DATA'; id: string; data: Partial<Sensei> }
  | { type: 'ADD_MODIFIED_ID'; id: string }
  | { type: 'REMOVE_MODIFIED_ID'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SENSEIS': return { ...state, senseis: action.payload, modifiedIds: new Set() }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_GLOBAL_FILTER': return { ...state, globalFilter: action.payload }
    case 'SET_ESPECIALIDAD_FILTER': return { ...state, especialidadFilter: action.payload }
    case 'SET_ESTADO_FILTER': return { ...state, estadoFilter: action.payload }
    case 'TOGGLE_SHOW_FILTERS': return { ...state, showFilters: !state.showFilters }
    case 'CLEAR_FILTERS': return { 
      ...state, 
      especialidadFilter: 'all', 
      estadoFilter: 'all', 
      globalFilter: action.initialSearch, 
      modifiedIds: new Set() 
    }
    case 'UPDATE_SENSEI_STATUS': return {
      ...state,
      senseis: state.senseis.map(s => s.id === action.id ? { ...s, activo: action.activo } : s)
    }
    case 'UPDATE_SENSEI_DATA': return {
      ...state,
      senseis: state.senseis.map(s => s.id === action.id ? { ...s, ...action.data } : s)
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

export function useSenseiList(initialSearch: string = '') {
  const [state, dispatch] = useReducer(reducer, {
    senseis: [],
    loading: true,
    error: null,
    globalFilter: initialSearch,
    especialidadFilter: 'all',
    estadoFilter: 'all',
    showFilters: false,
    modifiedIds: new Set()
  })

  const loadSenseis = useCallback(async (_clubId?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      // Siempre cargamos todos los senseis y filtramos localmente
      // Esto permite showUnassigned (sin club) funcione igual que en judokas
      const response = await senseiController.getAllSenseis(true)
        
      if (response.success && response.data) {
        dispatch({ type: 'SET_SENSEIS', payload: response.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al cargar los senseis' })
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Error inesperado al cargar los senseis' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    dispatch({ type: 'ADD_MODIFIED_ID', id })
    dispatch({ type: 'UPDATE_SENSEI_STATUS', id, activo: !currentStatus })
    
    try {
      const response = await senseiController.updateSensei(id, { activo: !currentStatus })
      if (!response.success) {
        dispatch({ type: 'UPDATE_SENSEI_STATUS', id, activo: currentStatus })
        dispatch({ type: 'REMOVE_MODIFIED_ID', id })
        alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
      }
    } catch (err) {
      dispatch({ type: 'UPDATE_SENSEI_STATUS', id, activo: currentStatus })
      dispatch({ type: 'REMOVE_MODIFIED_ID', id })
      console.error(err)
      alert('Error inesperado al cambiar el estado')
    }
  }, [])

  const updateLocalSensei = useCallback((id: string, data: Partial<Sensei>) => {
    dispatch({ type: 'UPDATE_SENSEI_DATA', id, data })
  }, [])

  const deleteLocalSensei = useCallback((id: string) => {
    dispatch({ type: 'SET_SENSEIS', payload: state.senseis.filter(s => s.id !== id) })
  }, [state.senseis])

  const filteredData = useMemo(() => {
    const filtered = state.senseis.filter(s => {
      const matchEspecialidad = state.especialidadFilter === 'all' || s.especialidad === state.especialidadFilter
      const matchEstado = state.estadoFilter === 'all' || (state.estadoFilter === 'activo' ? s.activo : !s.activo)
      const search = state.globalFilter.toLowerCase()
      const matchSearch = !search || 
        s.nombres?.toLowerCase().includes(search) ||
        s.apellidos?.toLowerCase().includes(search) ||
        s.ci?.toLowerCase().includes(search) ||
        s.grado_dan?.toLowerCase().includes(search) ||
        s.especialidad?.toLowerCase().includes(search)
      return matchEspecialidad && matchEstado && matchSearch
    })

    return [...filtered].sort((a, b) => {
      const isAModified = state.modifiedIds.has(a.id)
      const isBModified = state.modifiedIds.has(b.id)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo
      if (effectiveAActive === effectiveBActive) return 0
      return effectiveAActive ? -1 : 1
    })
  }, [state.senseis, state.especialidadFilter, state.estadoFilter, state.globalFilter, state.modifiedIds])

  return { 
    state, 
    dispatch, 
    loadSenseis, 
    toggleStatus, 
    updateLocalSensei,
    filteredData 
  }
}
