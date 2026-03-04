import { useReducer, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clubSchema } from '@/utils/zodSchemas'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club, ClubCreate } from '@/models/club'
import { Sensei, SenseiCreate } from '@/models/sensei'

type State = {
  senseis: Sensei[]
  newDirector: {
    nombres: string
    apellidoPaterno: string
    apellidoMaterno: string
    email: string
    ci: string
  }
  loading: boolean
  loadingSenseis: boolean
  error: string | null
  success: boolean
  isCreatingNewDirector: boolean
}

type Action =
  | { type: 'SET_SENSEIS'; payload: Sensei[] }
  | { type: 'SET_NEW_DIRECTOR_FIELD'; field: keyof State['newDirector']; value: string }
  | { type: 'RESET_NEW_DIRECTOR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_SENSEIS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: boolean }
  | { type: 'SET_IS_CREATING_NEW_DIRECTOR'; payload: boolean }

const initialState: State = {
  senseis: [],
  newDirector: {
    nombres: '',
    apellidoPaterno: '',
    apellido_materno: '', // Nota: en el estado original se usaba camelCase, pero en el form se usaban variables sueltas. Unificamos.
    email: '',
    ci: '',
  } as any,
  loading: false,
  loadingSenseis: true,
  error: null,
  success: false,
  isCreatingNewDirector: false,
}

// Corrigiendo la inicialización del estado para que coincida con el uso
const fixedInitialState: State = {
  ...initialState,
  newDirector: {
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    ci: '',
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SENSEIS': return { ...state, senseis: action.payload }
    case 'SET_NEW_DIRECTOR_FIELD': return { ...state, newDirector: { ...state.newDirector, [action.field]: action.value } }
    case 'RESET_NEW_DIRECTOR': return { ...state, newDirector: fixedInitialState.newDirector }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_LOADING_SENSEIS': return { ...state, loadingSenseis: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_SUCCESS': return { ...state, success: action.payload }
    case 'SET_IS_CREATING_NEW_DIRECTOR': return { ...state, isCreatingNewDirector: action.payload }
    default: return state
  }
}

interface UseClubFormProps {
  club?: Club | null
  onSuccess?: () => void
}

export function useClubForm({ club, onSuccess }: UseClubFormProps) {
  const [state, dispatch] = useReducer(reducer, fixedInitialState)

  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clubSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      nombre_club: '',
      provincia: '',
      direccion: '',
      telefono_contacto: '',
      director_tecnico_id: null as string | null,
      activo: true
    },
  })

  useEffect(() => {
    let isMounted = true
    const loadSenseis = async () => {
      try {
        const response = await senseiController.getAllSenseis(false)
        if (isMounted && response.success && response.data) {
          if (club) {
            dispatch({ 
              type: 'SET_SENSEIS', 
              payload: response.data.filter(s => s.club_id === club.id || s.club_id === null) 
            })
          } else {
            dispatch({ 
              type: 'SET_SENSEIS', 
              payload: response.data.filter(s => s.club_id === null) 
            })
          }
        }
        if (isMounted) dispatch({ type: 'SET_LOADING_SENSEIS', payload: false })
      } catch (err) {
        console.error('Error loading senseis:', err)
        if (isMounted) dispatch({ type: 'SET_LOADING_SENSEIS', payload: false })
      }
    }
    loadSenseis()
    return () => { isMounted = false }
  }, [club])

  useEffect(() => {
    if (club) {
      reset({
        nombre_club: club.nombre_club,
        provincia: club.provincia || '',
        direccion: club.direccion || '',
        telefono_contacto: club.telefono_contacto || '',
        director_tecnico_id: club.director_tecnico_id || null,
        activo: club.activo
      })
      dispatch({ type: 'RESET_NEW_DIRECTOR' })
    }
  }, [club, reset])

  const onSubmit = async (data: z.infer<typeof clubSchema>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: false })

    let directorTecnicoId = data.director_tecnico_id || null

    // Validar datos del nuevo director antes del try/catch para el React Compiler
    if (!club && !directorTecnicoId && state.newDirector.nombres.trim() !== '') {
      if (!state.newDirector.email.trim() || !state.newDirector.ci.trim()) {
        dispatch({ type: 'SET_ERROR', payload: 'Email y carnet de identidad son requeridos' })
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }
    }

    try {
      let createdSenseiId: string | null = null

      if (!club && !directorTecnicoId && state.newDirector.nombres.trim() !== '') {
        const senseiToCreate: SenseiCreate = {
          usuario_id: 'temp-user-id',
          nombres: state.newDirector.nombres.trim(),
          apellido_paterno: state.newDirector.apellidoPaterno.trim(),
          apellido_materno: state.newDirector.apellidoMaterno.trim(),
          email: state.newDirector.email.trim(),
          ci: state.newDirector.ci.trim(),
          isEncargado: true,
          activo: true
        }

        const senseiResponse = await senseiController.createSensei(senseiToCreate)
        if (!senseiResponse.success || !senseiResponse.data) {
          throw new Error(senseiResponse.error || 'Error al crear el director técnico')
        }

        createdSenseiId = senseiResponse.data.id
        directorTecnicoId = senseiResponse.data.id
      }

      const clubPayload: ClubCreate = { ...data, director_tecnico_id: directorTecnicoId } as ClubCreate
      let response
      
      if (club) {
        response = await clubController.updateClub(club.id, clubPayload)
      } else {
        response = await clubController.createClub(clubPayload)
        if (response.success && response.data && createdSenseiId) {
          await senseiController.updateSensei(createdSenseiId, { club_id: response.data.id })
        }
      }

      if (response.success) {
        dispatch({ type: 'SET_SUCCESS', payload: true })
        if (onSuccess) setTimeout(() => onSuccess(), 1000)
      } else {
        throw new Error(response.error || 'Error al guardar el club')
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error inesperado' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return {
    state,
    dispatch,
    control,
    handleSubmit,
    onSubmit,
    errors,
    reset,
    setFocus,
    trigger
  }
}
