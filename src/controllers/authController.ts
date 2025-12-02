import { authService } from '@/services/authService'
import { ApiResponse } from '@/types'
import { LoginCredentials, SignUpData, User, AuthSession } from '@/models/auth'

export const authController = {
  /**
   * Iniciar sesión con validaciones
   */
  async signIn(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
    // Validaciones
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        error: 'Email y contraseña son requeridos',
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(credentials.email)) {
      return {
        success: false,
        error: 'El formato del email no es válido',
      }
    }

    // Validar longitud de contraseña
    if (credentials.password.length < 6) {
      return {
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres',
      }
    }

    // Llamar al servicio
    const response = await authService.signIn(credentials)

    if (!response.success) {
      return response
    }

    // Verificar que el usuario esté activo
    if (response.data && !response.data.user.activo) {
      return {
        success: false,
        error: 'Tu cuenta está inactiva. Contacta al administrador.',
      }
    }

    return response
  },

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<ApiResponse<void>> {
    return await authService.signOut()
  },

  /**
   * Registrar nuevo usuario con validaciones
   */
  async signUp(signUpData: SignUpData): Promise<ApiResponse<{ userId: string }>> {
    // Validaciones
    if (!signUpData.email || !signUpData.password || !signUpData.nombres || !signUpData.apellidos) {
      return {
        success: false,
        error: 'Todos los campos son requeridos',
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(signUpData.email)) {
      return {
        success: false,
        error: 'El formato del email no es válido',
      }
    }

    // Validar longitud de contraseña
    if (signUpData.password.length < 8) {
      return {
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres',
      }
    }

    // Validar que la contraseña tenga al menos una mayúscula, una minúscula y un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordRegex.test(signUpData.password)) {
      return {
        success: false,
        error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      }
    }

    // Validar nombres y apellidos
    if (signUpData.nombres.trim().length < 2) {
      return {
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres',
      }
    }

    if (signUpData.apellidos.trim().length < 2) {
      return {
        success: false,
        error: 'Los apellidos deben tener al menos 2 caracteres',
      }
    }

    // Validar rol
    const validRoles = ['asociacion', 'sensei', 'arbitro', 'judoka']
    if (signUpData.rol && !validRoles.includes(signUpData.rol)) {
      return {
        success: false,
        error: 'Rol no válido',
      }
    }

    // Llamar al servicio
    return await authService.signUp(signUpData)
  },

  /**
   * Obtener el usuario actual
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    return await authService.getCurrentUser()
  },

  /**
   * Restablecer contraseña con validaciones
   */
  async resetPassword(email: string, redirectUrl?: string): Promise<ApiResponse<void>> {
    if (!email) {
      return {
        success: false,
        error: 'El email es requerido',
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'El formato del email no es válido',
      }
    }

    return await authService.resetPassword(email, redirectUrl)
  },

  /**
   * Actualizar contraseña con validaciones
   */
  async updatePassword(newPassword: string): Promise<ApiResponse<void>> {
    if (!newPassword) {
      return {
        success: false,
        error: 'La nueva contraseña es requerida',
      }
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres',
      }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordRegex.test(newPassword)) {
      return {
        success: false,
        error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      }
    }

    return await authService.updatePassword(newPassword)
  },

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    if (!userId) {
      return {
        success: false,
        error: 'ID de usuario requerido',
      }
    }

    // Validaciones básicas
    if (data.nombres && data.nombres.trim().length < 2) {
      return {
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres',
      }
    }

    if (data.apellidos && data.apellidos.trim().length < 2) {
      return {
        success: false,
        error: 'Los apellidos deben tener al menos 2 caracteres',
      }
    }

    return await authService.updateProfile(userId, data)
  },

  /**
   * Subir avatar de usuario
   */
  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<string>> {
    if (!userId || !file) {
      return {
        success: false,
        error: 'Datos incompletos para subir imagen',
      }
    }
    return await authService.uploadAvatar(userId, file)
  },
}

