import { useReducer, useEffect } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { miembroAsociacionSchema } from '@/utils/zodSchemas'
import { asociacionController } from '@/controllers/asociacionController'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'

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

interface UseMiembroAsociacionFormProps {
  miembro?: MiembroAsociacion | null
  onSuccess?: () => void
}

export function useMiembroAsociacionForm({ miembro, onSuccess }: UseMiembroAsociacionFormProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(miembroAsociacionSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      cargo: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      genero: '',
      fecha_ingreso: null as string | null,
      activo: true,
    },
  })

  useEffect(() => {
    if (miembro) {
      reset({
        nombres: miembro.nombres,
        apellido_paterno: miembro.apellido_paterno ?? miembro.apellidos?.split(/\s+/)[0] ?? '',
        apellido_materno: miembro.apellido_materno ?? miembro.apellidos?.split(/\s+/).slice(1).join(' ') ?? '',
        email: miembro.email,
        cargo: miembro.cargo ?? '',
        fecha_nacimiento: miembro.fecha_nacimiento || null,
        numero_celular: miembro.numero_celular || '',
        ci: miembro.ci || '',
        genero: miembro.genero || '',
        fecha_ingreso: miembro.fecha_ingreso || null,
        activo: miembro.activo,
      })
    }
  }, [miembro, reset])

  const onSubmit = async (data: z.infer<typeof miembroAsociacionSchema>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: false })

    try {
      let response
      if (miembro) {
        const updateData: MiembroAsociacionUpdate = {
          ...data,
          cargo: data.cargo || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          numero_celular: data.numero_celular || null,
          ci: data.ci || null,
          genero: data.genero || null,
          fecha_ingreso: data.fecha_ingreso || null,
        } as MiembroAsociacionUpdate
        response = await asociacionController.updateMiembro(miembro.id, updateData)
      } else {
        const createData: MiembroAsociacionCreate = {
          ...data,
          cargo: data.cargo || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          numero_celular: data.numero_celular || null,
          ci: data.ci || null,
          genero: data.genero || null,
          fecha_ingreso: data.fecha_ingreso || null,
          activo: data.activo ?? true,
        } as MiembroAsociacionCreate
        response = await asociacionController.createMiembro(createData)
      }

      if (response.success) {
        dispatch({ type: 'SET_SUCCESS', payload: true })
        if (onSuccess) setTimeout(() => onSuccess(), 1000)
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al guardar el miembro' })
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error inesperado' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof miembroAsociacionSchema>>) => {
    const errorKeys = Object.keys(formErrors) as (keyof z.infer<typeof miembroAsociacionSchema>)[]
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
