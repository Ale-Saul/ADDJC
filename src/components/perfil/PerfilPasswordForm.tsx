'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Stack,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { Controller } from 'react-hook-form'
import { usePasswordForm } from '@/hooks/usePasswordForm'

interface PerfilPasswordFormProps {
  password: ReturnType<typeof usePasswordForm>
}

export default function PerfilPasswordForm({ password }: PerfilPasswordFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <Box mt={8}>
      <Typography variant="h6" gutterBottom fontWeight="600">
        Seguridad
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {password.success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => password.setSuccess(null)}>{password.success}</Alert>}
      {password.error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => password.setError(null)}>{password.error}</Alert>}

      <Stack spacing={3} component="form" onSubmit={password.form.handleSubmit(password.onSubmit)}>
        <Controller
          name="currentPassword"
          control={password.form.control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Contraseña Actual"
              type={showCurrentPassword ? 'text' : 'password'}
              fullWidth
              required
              disabled={password.loading}
              error={!!password.form.formState.errors.currentPassword}
              helperText={password.form.formState.errors.currentPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Controller
            name="password"
            control={password.form.control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nueva Contraseña"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                required
                disabled={password.loading}
                error={!!password.form.formState.errors.password}
                helperText={password.form.formState.errors.password?.message || "Mínimo 8 caracteres, incluye Mayúscula, Minúscula y Número"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={password.form.control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Confirmar Nueva Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                required
                disabled={password.loading}
                error={!!password.form.formState.errors.confirmPassword}
                helperText={password.form.formState.errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="outlined"
            size="large"
            startIcon={password.loading ? <CircularProgress size={20} /> : <LockIcon />}
            disabled={password.loading}
            sx={{ height: 48, px: 4, borderRadius: 2 }}
          >
            {password.loading ? 'Cambiando...' : 'Actualizar Contraseña'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
