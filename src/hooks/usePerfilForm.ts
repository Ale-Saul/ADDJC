import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authController } from '@/controllers/authController'
import { User } from '@/models/auth'

const perfilSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son requeridos'),
  apellido_paterno: z.string().min(1, 'El apellido paterno es requerido'),
  apellido_materno: z.string().optional().nullable(),
})

export function usePerfilForm(user: User | null, refreshUser: () => Promise<void>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(perfilSchema),
    mode: 'onTouched',
    defaultValues: {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
    },
  })

  const { reset } = form

  useEffect(() => {
    if (user) {
      // Intentar extraer apellidos si vienen en un solo campo
      let paterno = user.apellido_paterno || ''
      let materno = user.apellido_materno || ''
      
      if (!paterno && user.apellidos) {
        const parts = user.apellidos.trim().split(/\s+/)
        paterno = parts[0] || ''
        materno = parts.slice(1).join(' ') || ''
      }

      reset({
        nombres: user.nombres || '',
        apellido_paterno: paterno,
        apellido_materno: materno,
      })
    }
  }, [user, reset])

  const onSubmit = useCallback(async (data: z.infer<typeof perfilSchema>) => {
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await authController.updateProfile(user.id, {
        nombres: data.nombres,
        apellido_paterno: data.apellido_paterno,
        apellido_materno: data.apellido_materno || null,
      })

      if (response.success) {
        setSuccess('Perfil actualizado correctamente')
        await refreshUser()
      } else {
        setError(response.error || 'Error al actualizar el perfil')
      }
    } catch (err) {
      console.error('Error al guardar perfil:', err)
      setError('Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }, [user, refreshUser])

  return {
    form,
    loading,
    error,
    success,
    setError,
    setSuccess,
    onSubmit
  }
}
