'use client'

import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Badge,
  IconButton,
  Stack,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { Controller } from 'react-hook-form'
import { User } from '@/models/auth'
import { usePerfilForm } from '@/hooks/usePerfilForm'

interface PerfilInfoFormProps {
  user: User | null
  perfil: ReturnType<typeof usePerfilForm>
  avatarUrl: string | null
  uploading: boolean
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  avatarSuccess: string | null
  avatarError: string | null
  setAvatarSuccess: (val: string | null) => void
  setAvatarError: (val: string | null) => void
  getRoleLabel: (rol: string) => string
}

export default function PerfilInfoForm({
  user,
  perfil,
  avatarUrl,
  uploading,
  onAvatarChange,
  avatarSuccess,
  avatarError,
  setAvatarSuccess,
  setAvatarError,
  getRoleLabel
}: PerfilInfoFormProps) {
  return (
    <Box>
      {/* Sección de Avatar */}
      <Box display="flex" flexDirection="column" alignItems="center" mb={5}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <IconButton
              component="label"
              disabled={uploading}
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                border: '3px solid white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 40,
                height: 40,
                boxShadow: 2
              }}
            >
              <input hidden accept="image/*" type="file" onChange={onAvatarChange} />
              {uploading ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          }
        >
          <Avatar 
            src={avatarUrl || undefined}
            sx={{ 
              width: 140, 
              height: 140, 
              fontSize: '3.5rem',
              bgcolor: 'primary.main',
              border: '4px solid white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            {user.nombres?.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
        {(avatarSuccess || avatarError) && (
          <Alert 
            severity={avatarSuccess ? "success" : "error"} 
            sx={{ mt: 2, width: '100%', maxWidth: 400 }}
            onClose={() => { setAvatarSuccess(null); setAvatarError(null); }}
          >
            {avatarSuccess || avatarError}
          </Alert>
        )}
      </Box>

      {/* Formulario de Información Personal */}
      <Box component="form" onSubmit={perfil.form.handleSubmit(perfil.onSubmit)} noValidate>
        <Typography variant="h6" gutterBottom fontWeight="600">
          Información Personal
        </Typography>
        <Divider sx={{ mb: 4 }} />
        
        {perfil.success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => perfil.setSuccess(null)}>{perfil.success}</Alert>}
        {perfil.error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => perfil.setError(null)}>{perfil.error}</Alert>}

        <Stack spacing={3}>
          <Controller
            name="nombres"
            control={perfil.form.control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nombres"
                fullWidth
                required
                disabled={perfil.loading}
                error={!!perfil.form.formState.errors.nombres}
                helperText={perfil.form.formState.errors.nombres?.message}
              />
            )}
          />

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Controller
              name="apellido_paterno"
              control={perfil.form.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Apellido Paterno"
                  fullWidth
                  required
                  disabled={perfil.loading}
                  error={!!perfil.form.formState.errors.apellido_paterno}
                  helperText={perfil.form.formState.errors.apellido_paterno?.message}
                />
              )}
            />
            <Controller
              name="apellido_materno"
              control={perfil.form.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Apellido Materno"
                  fullWidth
                  disabled={perfil.loading}
                  error={!!perfil.form.formState.errors.apellido_materno}
                  helperText={perfil.form.formState.errors.apellido_materno?.message}
                />
              )}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Correo Electrónico"
              fullWidth
              value={user.email}
              disabled
              helperText="El correo no puede ser modificado"
              InputProps={{ sx: { bgcolor: 'grey.50' } }}
            />
            <TextField
              label="Rol"
              fullWidth
              value={getRoleLabel(user.rol || '')}
              disabled
              helperText="Rol asignado por el sistema"
              InputProps={{ sx: { bgcolor: 'grey.50' } }}
            />
          </Box>

          <Box display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={perfil.loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={perfil.loading}
              sx={{ height: 48, px: 4, borderRadius: 2 }}
            >
              {perfil.loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
