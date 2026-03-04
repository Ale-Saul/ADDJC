import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authController } from '@/controllers/authController'
import { resetPasswordSchema } from '@/utils/zodSchemas'

// Extendemos el esquema para incluir la contraseña actual
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúscula, minúscula y número'),
  confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export function usePasswordForm(userEmail: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  })

  const { reset } = form

  const onSubmit = useCallback(async (data: z.infer<typeof changePasswordSchema>) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Verificar contraseña actual a través del controller
      const verifyResponse = await authController.verifyCurrentPassword(userEmail, data.currentPassword)
      if (!verifyResponse.success) {
        setError(verifyResponse.error || 'La contraseña actual es incorrecta')
        return
      }

      // 2. Actualizar a la nueva contraseña a través del controller
      const updateResponse = await authController.updatePassword(data.password)
      if (!updateResponse.success) {
        setError(updateResponse.error || 'Error al cambiar la contraseña')
      } else {
        setSuccess('Contraseña actualizada correctamente')
        reset()
      }
    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      setError('Error inesperado al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }, [userEmail, reset])

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
