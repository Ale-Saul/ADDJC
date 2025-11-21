import { createClient } from '@/lib/supabase/client'
import { ApiResponse } from '@/types'
import { LoginCredentials, SignUpData, User, AuthSession } from '@/models/auth'

export const authService = {
  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al iniciar sesión',
        }
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'No se pudo crear la sesión',
        }
      }

      // Obtener el perfil del usuario
      const profileResponse = await this.getUserProfile(data.user.id)
      
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: 'Error al obtener el perfil del usuario',
        }
      }

      return {
        success: true,
        data: {
          user: profileResponse.data,
          access_token: data.session.access_token,
          expires_at: data.session.expires_at,
        },
      }
    } catch (error) {
      console.error('Error en signIn:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al iniciar sesión'
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<ApiResponse<void>> {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al cerrar sesión',
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error en signOut:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cerrar sesión'
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Registrar nuevo usuario
   */
  async signUp(signUpData: SignUpData): Promise<ApiResponse<{ userId: string }>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            nombres: signUpData.nombres,
            apellidos: signUpData.apellidos,
            user_type: signUpData.rol || 'judoka',
            rol: signUpData.rol || 'judoka',
            club_id: signUpData.club_id,
          },
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al registrar usuario',
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No se pudo crear el usuario',
        }
      }

      return {
        success: true,
        data: { userId: data.user.id },
      }
    } catch (error) {
      console.error('Error en signUp:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar usuario'
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Obtener el usuario actual autenticado
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return { success: true, data: null }
      }

      const profileResponse = await this.getUserProfile(user.id)
      return profileResponse
    } catch (error) {
      console.error('Error en getCurrentUser:', error)
      return { success: true, data: null }
    }
  },

  /**
   * Obtener el perfil del usuario desde user_profiles
   */
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al obtener el perfil del usuario',
        }
      }

      if (!data) {
        return {
          success: false,
          error: 'Perfil de usuario no encontrado',
        }
      }

      return {
        success: true,
        data: {
          id: data.id,
          email: data.email || '',
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          rol: data.rol || 'judoka',
          club_id: data.club_id || null,
          activo: data.activo ?? true,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      }
    } catch (error) {
      console.error('Error en getUserProfile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener perfil'
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Enviar email para restablecer contraseña
   */
  async resetPassword(email: string, redirectUrl?: string): Promise<ApiResponse<void>> {
    try {
      const supabase = createClient()
      const redirectTo = redirectUrl || (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '/reset-password')
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al enviar el email de recuperación',
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error en resetPassword:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al restablecer contraseña'
      return {
        success: false,
        error: errorMessage,
      }
    }
  },

  /**
   * Actualizar contraseña
   */
  async updatePassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al actualizar la contraseña',
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error en updatePassword:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar contraseña'
      return {
        success: false,
        error: errorMessage,
      }
    }
  },
}

