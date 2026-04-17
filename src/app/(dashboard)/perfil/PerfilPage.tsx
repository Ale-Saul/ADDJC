'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { authController } from '@/controllers/authController'
import { usePerfilForm } from '@/hooks/usePerfilForm'
import { usePasswordForm } from '@/hooks/usePasswordForm'
import PerfilInfoForm from '@/components/perfil/PerfilInfoForm'
import PerfilPasswordForm from '@/components/perfil/PerfilPasswordForm'
import { formatters } from '@/utils/formatters'

export default function PerfilPage() {
  const { user, refreshUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null)

  // Hooks de formulario
  const perfil = usePerfilForm(user, refreshUser)
  const password = usePasswordForm(user?.email || '')

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) return
      
      const file = event.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setAvatarError('La imagen no debe superar los 2MB')
        return
      }

      setUploading(true)
      setAvatarError(null)
      setAvatarSuccess(null)

      const response = await authController.uploadAvatar(user.id, file)
      
      if (response.success && response.data) {
        await refreshUser()
        const img = new Image()
        img.onload = () => {
          setAvatarUrl(response.data!)
          setUploading(false)
          setAvatarSuccess('Foto de perfil actualizada correctamente')
        }
        img.src = response.data
      } else {
        setAvatarError(response.error || 'Error al subir la imagen')
        setUploading(false)
      }
    } catch (err) {
      setAvatarError('Error inesperado al subir la imagen')
      setUploading(false)
    }
  }

  const getRoleLabel = (rol: string) => formatters.formatRole(rol)

  if (!user) {
    return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
    )
  }

  return (
    <ProtectedRoute>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Mi Perfil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tu información personal y seguridad de la cuenta
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          variant="outlined"
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            maxWidth: 900, 
            mx: 'auto', 
            borderRadius: 3,
            backgroundColor: 'background.paper'
          }}
        >
          <PerfilInfoForm 
            user={user}
            perfil={perfil}
            avatarUrl={avatarUrl}
            uploading={uploading}
            onAvatarChange={handleAvatarChange}
            avatarSuccess={avatarSuccess}
            avatarError={avatarError}
            setAvatarSuccess={setAvatarSuccess}
            setAvatarError={setAvatarError}
            getRoleLabel={getRoleLabel}
          />

          <PerfilPasswordForm password={password} />
        </Paper>
    </ProtectedRoute>
  )
}
