import { useReducer, useEffect, useMemo } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { judokaSchema } from '@/utils/zodSchemas'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { judokaController } from '@/controllers/judokaController'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { Club } from '@/models/club'
import { Sensei } from '@/models/sensei'

type State = {
  clubes: Club[]
  senseis: Sensei[]
  loading: boolean
  loadingClubes: boolean
  loadingSenseis: boolean
  error: string | null
  success: boolean
}

type Action =
  | { type: 'SET_CLUBES'; payload: Club[] }
  | { type: 'SET_SENSEIS'; payload: Sensei[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_CLUBES'; payload: boolean }
  | { type: 'SET_LOADING_SENSEIS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: boolean }

const initialState: State = {
  clubes: [],
  senseis: [],
  loading: false,
  loadingClubes: true,
  loadingSenseis: false,
  error: null,
  success: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CLUBES': return { ...state, clubes: action.payload }
    case 'SET_SENSEIS': return { ...state, senseis: action.payload }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_LOADING_CLUBES': return { ...state, loadingClubes: action.payload }
    case 'SET_LOADING_SENSEIS': return { ...state, loadingSenseis: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_SUCCESS': return { ...state, success: action.payload }
    default: return state
  }
}

interface UseJudokaFormProps {
  judoka?: Judoka | null
  onSuccess?: () => void
}

export function useJudokaForm({ judoka, onSuccess }: UseJudokaFormProps) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(judokaSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      club_id: '',
      entrenador_id: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      categoria: '',
      cinturon_actual: '',
      activo: true,
    },
  })

  const watchClubId = watch('club_id')

  // Cargar clubes iniciales
  useEffect(() => {
    let isMounted = true
    const loadClubes = async () => {
      try {
        const response = await clubController.getAllClubes(false)
        if (isMounted && response.success && response.data) {
          dispatch({ type: 'SET_CLUBES', payload: response.data })
        }
      } catch (err) {
        console.error('Error loading clubs:', err)
      } finally {
        if (isMounted) dispatch({ type: 'SET_LOADING_CLUBES', payload: false })
      }
    }
    loadClubes()
    return () => { isMounted = false }
  }, [])

  // Cargar senseis cuando cambia el club
  useEffect(() => {
    let isMounted = true
    const loadSenseis = async () => {
      if (watchClubId) {
        dispatch({ type: 'SET_LOADING_SENSEIS', payload: true })
        try {
          const response = await senseiController.getSenseisByClub(watchClubId)
          if (isMounted) {
            if (response.success && response.data) {
              dispatch({ type: 'SET_SENSEIS', payload: response.data })
            } else {
              dispatch({ type: 'SET_SENSEIS', payload: [] })
            }
          }
        } catch (err) {
          console.error('Error loading senseis:', err)
          if (isMounted) dispatch({ type: 'SET_SENSEIS', payload: [] })
        } finally {
          if (isMounted) dispatch({ type: 'SET_LOADING_SENSEIS', payload: false })
        }
      } else {
        dispatch({ type: 'SET_SENSEIS', payload: [] })
      }
    }
    loadSenseis()
    return () => { isMounted = false }
  }, [watchClubId])

  // Resetear formulario cuando cambia el judoka o el usuario
  useEffect(() => {
    if (judoka) {
      reset({
        club_id: judoka.club_id || '',
        entrenador_id: judoka.entrenador_id || '',
        nombres: judoka.nombres || '',
        apellido_paterno: judoka.apellido_paterno ?? judoka.apellidos?.trim().split(/\s+/)[0] ?? '',
        apellido_materno: judoka.apellido_materno ?? judoka.apellidos?.trim().split(/\s+/).slice(1).join(' ') ?? '',
        email: judoka.email || '',
        fecha_nacimiento: judoka.fecha_nacimiento || null,
        numero_celular: judoka.numero_celular || '',
        ci: judoka.ci || '',
        genero: judoka.genero || '',
        categoria: judoka.categoria || '',
        cinturon_actual: judoka.cinturon_actual || '',
        activo: judoka.activo,
      })
    } else if (user && user.club_id) {
      // Pre-completar club para sensei/encargado
      const defaultValues: any = { club_id: user.club_id }
      if (user.rol === 'sensei') {
        defaultValues.entrenador_id = user.sensei_id || ''
      }
      reset(prev => ({ ...prev, ...defaultValues }))
    }
  }, [judoka, user, reset])

  const sortedClubes = useMemo(() => 
    [...state.clubes].sort((a, b) => a.nombre_club.localeCompare(b.nombre_club)), 
    [state.clubes]
  )
  
  const sortedSenseis = useMemo(() => 
    [...state.senseis].sort((a, b) => {
      const nameA = (a.nombres + ' ' + (a.apellidos || '')).trim()
      const nameB = (b.nombres + ' ' + (b.apellidos || '')).trim()
      return nameA.localeCompare(nameB)
    }), 
    [state.senseis]
  )

  const onSubmit = async (data: z.infer<typeof judokaSchema>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: false })

    try {
      let response
      const payload = {
        ...data,
        club_id: data.club_id || null,
        entrenador_id: data.entrenador_id || null,
        apellido_paterno: data.apellido_paterno?.trim() || null,
        apellido_materno: data.apellido_materno?.trim() || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        numero_celular: data.numero_celular || null,
        genero: data.genero || null,
        categoria: data.categoria || null,
        cinturon_actual: data.cinturon_actual || null,
      }

      if (judoka) {
        response = await judokaController.updateJudoka(judoka.id, payload as JudokaUpdate)
      } else {
        const createData: JudokaCreate = {
          ...(payload as JudokaCreate),
          usuario_id: 'temp-user-id',
        }
        response = await judokaController.createJudoka(createData)
      }

      if (response.success) {
        dispatch({ type: 'SET_SUCCESS', payload: true })
        if (onSuccess) {
          setTimeout(() => onSuccess(), 500)
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al guardar el judoka' })
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error inesperado' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof judokaSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof judokaSchema>)[]
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0]
      setFocus(firstField, { shouldSelect: true })
      setTimeout(() => {
        const element = document.getElementsByName(firstField)[0]
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  return {
    state,
    control,
    handleSubmit,
    onSubmit,
    onError,
    errors,
    watchClubId,
    sortedClubes,
    sortedSenseis,
    user,
    dispatch
  }
}
