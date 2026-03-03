import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { arbitroController } from '@/controllers/arbitroController'
import { arbitroSchema } from '@/utils/zodSchemas'

export function useArbitroForm(arbitro?: Arbitro | null, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(arbitroSchema),
    mode: 'onChange',
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

  const { reset } = form

  useEffect(() => {
    if (arbitro) {
      const ap = arbitro.apellidos?.trim().split(/\s+/) ?? []
      const a = arbitro as Arbitro
      reset({
        nombres: a.nombres,
        apellido_paterno: a.apellido_paterno ?? ap[0] ?? '',
        apellido_materno: a.apellido_materno ?? ap.slice(1).join(' ') ?? '',
        email: a.email || '',
        fecha_nacimiento: a.fecha_nacimiento || null,
        numero_celular: a.numero_celular || '',
        ci: a.ci || '',
        genero: a.genero || '',
        nivel_arbitraje: a.nivel_arbitraje || '',
        activo: a.activo,
      })
    }
  }, [arbitro, reset])

  const onSubmit = useCallback(async (data: z.infer<typeof arbitroSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
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

      let response
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
        setSuccess(true)
        if (onSuccess) {
          setTimeout(onSuccess, 1000)
        }
        setLoading(false)
      } else {
        setError(response.error || 'Error al guardar el árbitro')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }, [arbitro, onSuccess])

  return {
    form,
    loading,
    error,
    success,
    setError,
    onSubmit
  }
}
