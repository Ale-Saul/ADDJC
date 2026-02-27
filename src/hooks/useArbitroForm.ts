import { useReducer, useEffect } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { arbitroSchema } from '@/utils/zodSchemas'
import { arbitroController } from '@/controllers/arbitroController'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'

type State = {
  loading: boolean
  error: string | null
  success: boolean
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: boolean }

const initialState: State = {
  loading: false,
  error: null,
  success: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_SUCCESS': return { ...state, success: action.payload }
    default: return state
  }
}

interface UseArbitroFormProps {
  arbitro?: Arbitro | null
  onSuccess?: () => void
}

export function useArbitroForm({ arbitro, onSuccess }: UseArbitroFormProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(arbitroSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      nivel_arbitraje: '',
      activo: true,
    },
  })

  useEffect(() => {
    if (arbitro) {
      const ap = arbitro.apellidos?.trim().split(/\s+/) ?? []
      reset({
        nombres: arbitro.nombres,
        apellido_paterno: arbitro.apellido_paterno ?? ap[0] ?? '',
        apellido_materno: arbitro.apellido_materno ?? ap.slice(1).join(' ') ?? '',
        email: arbitro.email || '',
        fecha_nacimiento: arbitro.fecha_nacimiento || null,
        numero_celular: arbitro.numero_celular || '',
        ci: arbitro.ci || '',
        genero: arbitro.genero || '',
        nivel_arbitraje: arbitro.nivel_arbitraje || '',
        activo: arbitro.activo,
      })
    }
  }, [arbitro, reset])

  const onSubmit = async (data: z.infer<typeof arbitroSchema>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: false })

    try {
      let response
      const payload = {
        ...data,
        apellido_paterno: data.apellido_paterno?.trim() || null,
        apellido_materno: data.apellido_materno?.trim() || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        numero_celular: data.numero_celular || null,
        ci: data.ci || null,
        genero: data.genero || null,
        nivel_arbitraje: data.nivel_arbitraje || null,
      }

      if (arbitro) {
        response = await arbitroController.updateArbitro(arbitro.id, payload as ArbitroUpdate)
      } else {
        const createData: ArbitroCreate = {
          ...(payload as ArbitroCreate),
          usuario_id: 'temp-user-id',
        }
        response = await arbitroController.createArbitro(createData)
      }

      if (response.success) {
        dispatch({ type: 'SET_SUCCESS', payload: true })
        if (onSuccess) setTimeout(() => onSuccess(), 1000)
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al guardar el árbitro' })
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error inesperado' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof arbitroSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof arbitroSchema>)[]
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
    errors
  }
}
