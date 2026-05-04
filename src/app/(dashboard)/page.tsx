'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ROL } from '@/constants/roles'
import { Box, CircularProgress } from '@mui/material'

export default function Page() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user) return

    const role = user.rol

    switch (role) {
      case ROL.ADMIN:
      case ROL.SENSEI:
      case ROL.ENCARGADO:
        router.replace('/asistencia')
        break
      case ROL.ASOCIACION:
        router.replace('/asistencia/consulta')
        break
      case ROL.JUDOKA:
        router.replace('/asistencia/mi-asistencia')
        break
      case ROL.ARBITRO:
        router.replace('/arbitros')
        break
      default:
        router.replace('/perfil')
    }
  }, [user, loading, router])

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
    </Box>
  )
}
