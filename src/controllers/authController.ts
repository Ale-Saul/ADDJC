import { z } from 'zod'
import { loginSchema, emailSchema, passwordSchema, perfilSchema } from '@/schemas/globales'
import { authService } from '@/services/authService'
import { ApiResponse } from '@/types/globales'
import { LoginCredentials, SignUpData, User, AuthSession, UserRole } from '@/models/auth'
import { ROL } from '@/constants/roles'

export const authController = {
  /**
   * Iniciar sesión con validaciones
   */
  async signIn(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
    // Validaciones
    const validation = loginSchema.safeParse(credentials)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
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
    const emailResult = emailSchema.safeParse(signUpData.email)
    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error.issues[0].message,
      }
    }

    // Validar contraseña
    const pwdResult = passwordSchema.safeParse(signUpData.password)
    if (!pwdResult.success) {
      return {
        success: false,
        error: pwdResult.error.issues[0].message,
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
    const validRoles: UserRole[] = Object.values(ROL)
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

    const emailResult = emailSchema.safeParse(email)
    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error.issues[0].message,
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

    const pwdResult = passwordSchema.safeParse(newPassword)
    if (!pwdResult.success) {
      return {
        success: false,
        error: pwdResult.error.issues[0].message,
      }
    }

    return await authService.updatePassword(newPassword)
  },

  /**
   * Actualizar contraseña y marcar como completado el cambio obligatorio
   */
  async completePasswordChange(newPassword: string, userId: string): Promise<ApiResponse<void>> {
    if (!newPassword) {
      return {
        success: false,
        error: 'La nueva contraseña es requerida',
      }
    }

    const pwdResult = passwordSchema.safeParse(newPassword)
    if (!pwdResult.success) {
      return {
        success: false,
        error: pwdResult.error.issues[0].message,
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'ID de usuario requerido',
      }
    }

    return await authService.completePasswordChange(newPassword, userId)
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

    // Validaciones de negocio - Solo validamos lo que mandan (Partial)
    const validation = z.object({
      nombres: z.string().optional(),
      apellido_paterno: z.string().optional(),
      apellido_materno: z.string().optional(),
      apellidos: z.string().optional()
    }).safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? 'Error de validación de perfil',
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

  /**
   * Verificar la contraseña actual del usuario (re-autenticación)
   */
  async verifyCurrentPassword(email: string, password: string): Promise<ApiResponse<void>> {
    if (!email || !password) {
      return { success: false, error: 'Email y contraseña son requeridos' }
    }
    return await authService.verifyCurrentPassword(email, password)
  },

  /**
   * Obtener la sesión actual
   */
  async getSession(): Promise<ApiResponse<boolean>> {
    return authService.getSession()
  },

  /**
   * Intercambiar código de autorización por sesión
   */
  async exchangeCodeForSession(code: string): Promise<ApiResponse<boolean>> {
    if (!code) return { success: false, error: 'Código requerido' }
    return authService.exchangeCodeForSession(code)
  },
}



