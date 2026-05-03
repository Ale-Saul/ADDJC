import { perfilSchema } from '@/schemas/globales'
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authController } from '@/controllers/authController'
import { User } from '@/models/auth'
import { formatters } from '@/utils/formatters'

export function usePerfilForm(user: User | null, refreshUser: () => Promise<void>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(perfilSchema),
    mode: 'onTouched',
    defaultValues: {
      nombres: user?.nombres || '',
      primer_apellido: user?.apellido_paterno || '',
      segundo_apellido: user?.apellido_materno || '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        nombres: user.nombres || '',
        primer_apellido: user.apellido_paterno || '',
        segundo_apellido: user.apellido_materno || '',
      })
    }
  }, [user, form.reset])

  const onSubmit = useCallback(async (data: z.infer<typeof perfilSchema>) => {
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Como Zod ya limpió los espacios (trim, multiples espacios), actualizamos la UI para que se refleje:
      form.setValue('nombres', data.nombres)
      form.setValue('primer_apellido', data.primer_apellido)
      form.setValue('segundo_apellido', data.segundo_apellido || '')

      const response = await authController.updateProfile(user.id, {
        nombres: data.nombres,
        apellido_paterno: data.primer_apellido,
        apellido_materno: data.segundo_apellido,
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

  return { form, loading, error, success, setError, setSuccess, onSubmit }
}
