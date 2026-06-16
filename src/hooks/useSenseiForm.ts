import { useState, useEffect, useCallback, useRef } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'
import { User } from '@/models/auth'
import { senseiSchema } from '@/schemas/globales'
import { createClient } from '@/lib/supabase/client'

/** Información del usuario directivo detectado por CI (vinculación silenciosa) */
export interface UsuarioDirectivoDetectado {
  id: string
  nombre: string
  rol: 'admin' | 'asociacion'
}

export function useSenseiForm(sensei?: Sensei | null, user?: User, onSuccess?: () => void) {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  // Estado para la vinculación silenciosa
  const [usuarioDirectivo, setUsuarioDirectivo] = useState<UsuarioDirectivoDetectado | null>(null)
  const [buscandoCI, setBuscandoCI] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm({
    resolver: zodResolver(senseiSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      club_id: sensei?.club_id || (user?.rol === 'encargado' && !sensei ? user?.club_id || '' : ''),
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      fecha_nacimiento: null as string | null,
      numero_celular: '',
      ci: '',
      ci_extension: '',
      genero: '',
      grado_dan: '',
      especialidad: '',
      activo: true,
    },
  })

  const { reset, watch } = form
  const ciValue = watch('ci')

  // Lookup por CI: detectar si pertenece a un usuario directivo (admin/asociacion)
  useEffect(() => {
    // Solo buscar en modo creación (no edición de sensei existente)
    if (sensei) return
    // Solo si el CI tiene al menos 4 dígitos
    if (!ciValue || ciValue.length < 4) {
      setUsuarioDirectivo(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setBuscandoCI(true)
      try {
        const client = createClient()
        const { data } = await client
          .from('usuarios')
          .select('id, nombre, apellido_paterno, apellido_materno, rol')
          .eq('ci', ciValue)
          .maybeSingle()

        if (data && (data.rol === 'admin' || data.rol === 'asociacion')) {
          setUsuarioDirectivo({
            id: data.id,
            nombre: [data.nombre, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' '),
            rol: data.rol,
          })
          // Autocompletar nombres si el form está vacío
          const formValues = form.getValues()
          if (!formValues.nombres && data.nombre) {
            form.setValue('nombres', data.nombre)
          }
          if (!formValues.apellido_paterno && data.apellido_paterno) {
            form.setValue('apellido_paterno', data.apellido_paterno)
          }
          if (!formValues.apellido_materno && data.apellido_materno) {
            form.setValue('apellido_materno', data.apellido_materno)
          }
        } else {
          setUsuarioDirectivo(null)
        }
      } finally {
        setBuscandoCI(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [ciValue, sensei, form])

  useEffect(() => {
    const loadInitialData = async () => {
      const response = await clubController.getAllClubes(false)
      if (response.success && response.data) {
        setClubes(response.data)
      }
      setLoadingClubes(false)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (sensei) {
      const s = sensei as Sensei
      reset({
        club_id: s.club_id || '',
        nombres: s.nombres,
        apellido_paterno: s.apellido_paterno || '',
        apellido_materno: s.apellido_materno || '',
        email: s.email || '',
        fecha_nacimiento: s.fecha_nacimiento || null,
        numero_celular: s.numero_celular || '',
        ci: s.ci || '',
        ci_extension: s.ci_extension || '',
        genero: s.genero || '',
        grado_dan: s.grado_dan || '',
        especialidad: s.especialidad || '',
        activo: s.activo,
      })
    } else if (user?.rol === 'encargado' && user.club_id) {
      reset(prev => ({ ...prev, club_id: user.club_id! }))
    }
  }, [sensei, user, reset])

  const onSubmit = useCallback(async (data: z.infer<typeof senseiSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
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
        updated_by: user?.id || null,
      }

      let response
      if (sensei) {
        response = await senseiController.updateSensei(sensei.id, {
          ...(payload as SenseiUpdate),
          updated_by: user?.id
        } as any)
      } else {
        // Si se detectó un usuario directivo por CI, usar su ID (vinculación silenciosa)
        // de lo contrario, usar 'temp-user-id' para que el servicio cree un nuevo usuario
        const usuarioId = usuarioDirectivo ? usuarioDirectivo.id : 'temp-user-id'

        const createData: SenseiCreate = {
          ...(payload as SenseiCreate),
          usuario_id: usuarioId,
          updated_by: user?.id
        } as any
        response = await senseiController.createSensei(createData)
      }

      if (response.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(onSuccess, 1000)
        }
        setLoading(false)
      } else {
        setError(response.error || 'Error al guardar el sensei')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }, [sensei, onSuccess, user, usuarioDirectivo])

  return {
    form,
    clubes,
    loading,
    loadingClubes,
    error,
    success,
    setError,
    onSubmit,
    // Multi-cargo
    usuarioDirectivo,
    buscandoCI,
  }
}
