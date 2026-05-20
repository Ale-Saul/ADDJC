import { useReducer, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clubSchema } from '@/schemas/globales'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club, ClubCreate } from '@/models/club'
import { Sensei, SenseiCreate } from '@/models/sensei'
import { formatHoraDbToInput, normalizeHoraForDb } from '@/utils/formatters'

type State = {
  senseis: Sensei[]
  newDirector: {
    nombres: string
    apellidoPaterno: string
    apellidoMaterno: string
    email: string
    ci: string
    ci_extension: string
  }
  loading: boolean
  loadingSenseis: boolean
  error: string | null
  success: boolean
  isCreatingNewDirector: boolean
}

type Action =
  | { type: 'SET_SENSEIS'; payload: Sensei[] }
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
    apellidoMaterno: '',
    email: '',
    ci: '',
    ci_extension: '',
  },
  loading: false,
  loadingSenseis: true,
  error: null,
  success: false,
  isCreatingNewDirector: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SENSEIS': return { ...state, senseis: action.payload }
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
  filesCount?: number
}

export function useClubForm({ club, onSuccess, filesCount = 0 }: UseClubFormProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(clubSchema),
    mode: 'onTouched',
    reValidateMode: 'onBlur',
    defaultValues: {
      nombre_club: '',
      provincia: '',
      direccion: '',
      telefono_contacto: '',
      horario_inicio: null as string | null,
      horario_fin: null as string | null,
      director_tecnico_id: null as string | null,
      activo: true,
      new_nombres: undefined,
      new_apellido_paterno: undefined,
      new_apellido_materno: undefined,
      new_email: undefined,
      new_ci: undefined,
      new_ci_extension: undefined,
    },
  })

  // Limpiar errores de nuevo director si se cancela la creación
  useEffect(() => {
    if (!state.isCreatingNewDirector) {
      const currentValues = control._formValues;
      reset({
        ...currentValues,
        new_nombres: undefined,
        new_apellido_paterno: undefined,
        new_apellido_materno: undefined,
        new_email: undefined,
        new_ci: undefined,
        new_ci_extension: undefined,
      }, { 
        keepDefaultValues: true 
      });
    } else {
      // Si se activa, inicializar con strings vacíos para que Zod empiece a validar al interactuar
      const currentValues = control._formValues;
      reset({
        ...currentValues,
        new_nombres: '',
        new_apellido_paterno: '',
        new_apellido_materno: '',
        new_email: '',
        new_ci: '',
        new_ci_extension: '',
      }, { 
        keepDefaultValues: true 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isCreatingNewDirector]);

  useEffect(() => {
    let isMounted = true
    const loadSenseis = async () => {
      try {
        const response = await senseiController.getAllSenseis(false)
        if (isMounted && response.success && response.data) {
          let filteredSenseis = response.data
          if (club) {
            filteredSenseis = response.data.filter(s => s.club_id === club.id || s.club_id === null)
          } else {
            filteredSenseis = response.data.filter(s => s.club_id === null)
          }
          
          dispatch({ 
            type: 'SET_SENSEIS', 
            payload: filteredSenseis
          })
        }
        if (isMounted) dispatch({ type: 'SET_LOADING_SENSEIS', payload: false })
      } catch (err) {
        console.error('Error loading senseis:', err)
        if (isMounted) dispatch({ type: 'SET_LOADING_SENSEIS', payload: false })
      }
    }
    loadSenseis()
    return () => { isMounted = false }
  }, [club?.id])

  useEffect(() => {
    if (club) {
      reset({
        nombre_club: club.nombre_club,
        provincia: club.provincia || '',
        direccion: club.direccion || '',
        telefono_contacto: club.telefono_contacto || '',
        horario_inicio: formatHoraDbToInput(club.horario_inicio),
        horario_fin: formatHoraDbToInput(club.horario_fin),
        director_tecnico_id: club.director_tecnico_id || null,
        activo: club.activo,
        new_nombres: undefined,
        new_apellido_paterno: undefined,
        new_apellido_materno: undefined,
        new_email: undefined,
        new_ci: undefined,
        new_ci_extension: undefined,
      })
    }
  }, [club, reset])

  const onSubmit = async (data: z.infer<typeof clubSchema>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: false })

    let directorTecnicoId = data.director_tecnico_id || null

    if (!club && !directorTecnicoId && state.isCreatingNewDirector) {
      const { new_nombres, new_email, new_ci, new_apellido_paterno, new_apellido_materno } = data;
      
      if (!new_nombres?.trim()) {
        dispatch({ type: 'SET_ERROR', payload: 'El nombre del director es requerido' })
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }
      if (!new_ci?.trim()) {
        dispatch({ type: 'SET_ERROR', payload: 'El CI del director es requerido' })
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }
      if (!new_email?.trim()) {
        dispatch({ type: 'SET_ERROR', payload: 'El email del director es requerido' })
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }
      if (!new_apellido_paterno?.trim() && !new_apellido_materno?.trim()) {
        dispatch({ type: 'SET_ERROR', payload: 'Al menos un apellido del director es requerido' })
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(new_email)) {
        dispatch({ type: 'SET_ERROR', payload: 'El formato del email del director no es válido' })
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }
    }

    try {
      let createdSenseiId: string | null = null

      if (!club && !directorTecnicoId && state.isCreatingNewDirector) {
        const senseiToCreate: SenseiCreate = {
          usuario_id: 'temp-user-id',
          nombres: data.new_nombres?.trim().replace(/\s+/g, ' ') || '',
          apellido_paterno: data.new_apellido_paterno?.trim().replace(/\s+/g, ' ') || '',
          apellido_materno: data.new_apellido_materno?.trim().replace(/\s+/g, ' ') || '',
          email: data.new_email?.trim() || '',
          ci: data.new_ci?.trim() || '',
          ci_extension: data.new_ci_extension?.trim() || null,
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

      const clubPayload: ClubCreate = { 
        ...data, 
        nombre_club: data.nombre_club.trim().replace(/\s+/g, ' '),
        direccion: data.direccion?.trim().replace(/\s+/g, ' ') || null,
        horario_inicio: normalizeHoraForDb(data.horario_inicio),
        horario_fin: normalizeHoraForDb(data.horario_fin),
        director_tecnico_id: directorTecnicoId 
      } as ClubCreate
      
      let response
      
      if (club) {
        response = await clubController.updateClub(club.id, clubPayload)
      } else {
        response = await clubController.createClub(clubPayload)
        if (response.success && response.data && createdSenseiId) {
          await senseiController.updateSensei(createdSenseiId, { club_id: response.data.id })
        }
      }

      // Si fue exitoso y hay datos, devolverlos para que el form pueda subir archivos
      if (response.success && response.data) {
        dispatch({ type: 'SET_SUCCESS', payload: true })
        dispatch({ type: 'SET_LOADING', payload: false })
        
        // Si no hay archivos o es actualización, llamar al éxito aquí
        if (filesCount === 0 || club) {
           if (onSuccess) onSuccess()
        }
        
        return response.data
      } else if (!response.success) {
        throw new Error(response.error || 'Error al guardar el club')
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error inesperado' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const senseiOptions = useMemo(() => state.senseis.map(s => ({
    value: s.id,
    label: `${s.nombres} ${s.apellidos}${s.grado_dan ? ` - ${s.grado_dan}` : ''}`
  })), [state.senseis])

  return {
    state,
    dispatch,
    control,
    handleSubmit,
    onSubmit,
    errors,
    reset,
    setFocus,
    trigger, 
    isValid, 
    isSubmitting,
    senseiOptions
  }
}
