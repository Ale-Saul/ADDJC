import { useReducer, useEffect, useCallback, useMemo } from 'react'
import { Club } from '@/models/club'
import { clubController } from '@/controllers/clubController'

type State = {
  clubes: Club[]
  loading: boolean
  error: string | null
  globalFilter: string
  municipioFilter: string
  estadoFilter: string
  showFilters: boolean
  modifiedIds: Set<string>
}

type Action =
  | { type: 'SET_CLUBES'; payload: Club[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_MUNICIPIO_FILTER'; payload: string }
  | { type: 'SET_ESTADO_FILTER'; payload: string }
  | { type: 'TOGGLE_SHOW_FILTERS' }
  | { type: 'CLEAR_FILTERS'; initialSearch: string }
  | { type: 'UPDATE_CLUB_STATUS'; id: string; activo: boolean }
  | { type: 'ADD_MODIFIED_ID'; id: string }
  | { type: 'REMOVE_MODIFIED_ID'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CLUBES': return { ...state, clubes: action.payload, modifiedIds: new Set() }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_GLOBAL_FILTER': return { ...state, globalFilter: action.payload }
    case 'SET_MUNICIPIO_FILTER': return { ...state, municipioFilter: action.payload }
    case 'SET_ESTADO_FILTER': return { ...state, estadoFilter: action.payload }
    case 'TOGGLE_SHOW_FILTERS': return { ...state, showFilters: !state.showFilters }
    case 'CLEAR_FILTERS': return { 
      ...state, 
      municipioFilter: 'all', 
      estadoFilter: 'all', 
      globalFilter: action.initialSearch, 
      modifiedIds: new Set() 
    }
    case 'UPDATE_CLUB_STATUS': return {
      ...state,
      clubes: state.clubes.map(c => c.id === action.id ? { ...c, activo: action.activo } : c)
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

export function useClubList(initialSearch: string = '') {
  const [state, dispatch] = useReducer(reducer, {
    clubes: [],
    loading: true,
    error: null,
    globalFilter: initialSearch,
    municipioFilter: 'all',
    estadoFilter: 'all',
    showFilters: false,
    modifiedIds: new Set()
  })

  const loadClubes = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const response = await clubController.getAllClubes(true)
      if (response.success && response.data) {
        dispatch({ type: 'SET_CLUBES', payload: response.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al cargar los clubes' })
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Error inesperado al cargar los clubes' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    dispatch({ type: 'ADD_MODIFIED_ID', id })
    dispatch({ type: 'UPDATE_CLUB_STATUS', id, activo: !currentStatus })
    
    try {
      const response = await clubController.updateClub(id, { activo: !currentStatus })
      if (!response.success) {
        dispatch({ type: 'UPDATE_CLUB_STATUS', id, activo: currentStatus })
        dispatch({ type: 'REMOVE_MODIFIED_ID', id })
        alert('Error al cambiar el estado: ' + (response.error || 'Error desconocido'))
      }
    } catch (err) {
      dispatch({ type: 'UPDATE_CLUB_STATUS', id, activo: currentStatus })
      dispatch({ type: 'REMOVE_MODIFIED_ID', id })
      console.error(err)
      alert('Error inesperado al cambiar el estado')
    }
  }, [])

  const filteredData = useMemo(() => {
    const filtered = state.clubes.filter(c => {
      const matchMunicipio = state.municipioFilter === 'all' || c.provincia === state.municipioFilter
      const matchEstado = state.estadoFilter === 'all' || (state.estadoFilter === 'activo' ? c.activo : !c.activo)
      const search = state.globalFilter.toLowerCase()
      const matchSearch = !search || 
        c.nombre_club?.toLowerCase().includes(search) ||
        c.provincia?.toLowerCase().includes(search) ||
        c.direccion?.toLowerCase().includes(search) ||
        c.telefono_contacto?.toLowerCase().includes(search)
      return matchMunicipio && matchEstado && matchSearch
    })

    return [...filtered].sort((a, b) => {
      const isAModified = state.modifiedIds.has(a.id)
      const isBModified = state.modifiedIds.has(b.id)
      const effectiveAActive = isAModified ? !a.activo : a.activo
      const effectiveBActive = isBModified ? !b.activo : b.activo
      if (effectiveAActive === effectiveBActive) return 0
      return effectiveAActive ? -1 : 1
    })
  }, [state.clubes, state.municipioFilter, state.estadoFilter, state.globalFilter, state.modifiedIds])

  return { state, dispatch, loadClubes, toggleStatus, filteredData }
}
