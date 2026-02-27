import { useReducer, useEffect } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { senseiSchema } from '@/utils/zodSchemas'
import { clubController } from '@/controllers/clubController'
import { senseiController } from '@/controllers/senseiController'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { Club } from '@/models/club'

type State = {
  clubes: Club[]
  loading: boolean
  loadingClubes: boolean
  error: string | null
  success: boolean
}

type Action =
  | { type: 'SET_CLUBES'; payload: Club[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_CLUBES'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: boolean }

const initialState: State = {
  clubes: [],
  loading: false,
  loadingClubes: true,
  error: null,
  success: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CLUBES': return { ...state, clubes: action.payload }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_LOADING_CLUBES': return { ...state, loadingClubes: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_SUCCESS': return { ...state, success: action.payload }
    default: return state
  }
}

interface UseSenseiFormProps {
  sensei?: Sensei | null
  onSuccess?: () => void
}

export function useSenseiForm({ sensei, onSuccess }: UseSenseiFormProps) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)

  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(senseiSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      club_id: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      grado_dan: '',
      especialidad: '',
      activo: true,
    },
  })

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

  useEffect(() => {
    if (sensei) {
      const apParts = sensei.apellidos?.trim().split(/\s+/) ?? []
      reset({
        club_id: sensei.club_id || '',
        nombres: sensei.nombres,
        apellido_paterno: sensei.apellido_paterno ?? apParts[0] ?? '',
        apellido_materno: sensei.apellido_materno ?? apParts.slice(1).join(' ') ?? '',
        email: sensei.email || '',
        fecha_nacimiento: sensei.fecha_nacimiento || null,
        numero_celular: sensei.numero_celular || '',
        ci: sensei.ci || '',
        genero: sensei.genero || '',
        grado_dan: sensei.grado_dan || '',
        especialidad: sensei.especialidad || '',
        activo: sensei.activo,
      })
    } else if (user?.rol === 'encargado' && user.club_id) {
      reset(prev => ({ ...prev, club_id: user.club_id! }))
    }
  }, [sensei, user, reset])

  const onSubmit = async (data: z.infer<typeof senseiSchema>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: false })

    try {
      let response
      const payload = {
        ...data,
        club_id: data.club_id || null,
        apellido_paterno: data.apellido_paterno?.trim() || null,
        apellido_materno: data.apellido_materno?.trim() || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        numero_celular: data.numero_celular || null,
        ci: data.ci || null,
        genero: data.genero || null,
        grado_dan: data.grado_dan || null,
        especialidad: data.especialidad || null,
      }

      if (sensei) {
        response = await senseiController.updateSensei(sensei.id, payload as SenseiUpdate)
      } else {
        const createData: SenseiCreate = {
          ...(payload as SenseiCreate),
          usuario_id: 'temp-user-id',
        }
        response = await senseiController.createSensei(createData)
      }

      if (response.success) {
        dispatch({ type: 'SET_SUCCESS', payload: true })
        if (onSuccess) setTimeout(() => onSuccess(), 1000)
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al guardar el sensei' })
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error inesperado' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof senseiSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof senseiSchema>)[]
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0]
      setFocus(firstField, { shouldSelect: true })
      setTimeout(() => {
        const element = document.getElementsByName(firstField)[0]
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }

  return {
    state,
    dispatch,
    control,
    handleSubmit,
    onSubmit,
    onError,
    errors,
    user
  }
}
