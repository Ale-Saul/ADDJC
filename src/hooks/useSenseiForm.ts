import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { senseiController } from '@/controllers/senseiController'
import { clubController } from '@/controllers/clubController'
import { Club } from '@/models/club'
import { User } from '@/models/auth'
import { senseiSchema } from '@/schemas/globales'
import { formatters } from '@/utils/formatters'

export function useSenseiForm(sensei?: Sensei | null, user?: User, onSuccess?: () => void) {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClubes, setLoadingClubes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const { reset } = form

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
        const createData: SenseiCreate = {
          ...(payload as SenseiCreate),
          usuario_id: 'temp-user-id',
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
  }, [sensei, onSuccess, user])

  return {
    form,
    clubes,
    loading,
    loadingClubes,
    error,
    success,
    setError,
    onSubmit
  }
}
