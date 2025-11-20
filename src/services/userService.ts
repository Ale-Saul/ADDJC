import { supabase } from '@/lib/supabase'
import { ApiResponse } from '@/types'

export const userService = {
  /**
   * Crear usuario y perfil para un árbitro
   */
  async createArbitroUser(nombres: string, apellidos: string): Promise<ApiResponse<{ userId: string }>> {
    try {
      // Generar email temporal único
      const tempEmail = `arbitro_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.com`
      const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + 'A1!'

      // Crear usuario en auth.users usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            nombres,
            apellidos,
            user_type: 'arbitro'
          }
        }
      })

      if (authError) {
        return { 
          success: false, 
          error: `Error al crear usuario: ${authError.message}` 
        }
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'Error: No se pudo crear el usuario' 
        }
      }

      const userId = authData.user.id

      // Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_type: 'arbitro',
          nombres,
          apellidos,
          activo: true
        })

      if (profileError) {
        // Si falla crear el perfil, intentar continuar de todas formas
        console.warn('Error al crear perfil de usuario:', profileError.message)
        // El perfil se puede crear después manualmente
      }

      return { success: true, data: { userId } }
    } catch (error) {
      console.error('Error al crear usuario de árbitro:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear usuario y perfil para un sensei
   */
  async createSenseiUser(nombres: string, apellidos: string): Promise<ApiResponse<{ userId: string }>> {
    try {
      // Generar email temporal único
      const tempEmail = `sensei_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.com`
      const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + 'A1!'

      // Crear usuario en auth.users usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            nombres,
            apellidos,
            user_type: 'sensei'
          }
        }
      })

      if (authError) {
        return { 
          success: false, 
          error: `Error al crear usuario: ${authError.message}` 
        }
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'Error: No se pudo crear el usuario' 
        }
      }

      const userId = authData.user.id

      // Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_type: 'sensei',
          nombres,
          apellidos,
          activo: true
        })

      if (profileError) {
        // Si falla crear el perfil, intentar continuar de todas formas
        console.warn('Error al crear perfil de usuario:', profileError.message)
        // El perfil se puede crear después manualmente
      }

      return { success: true, data: { userId } }
    } catch (error) {
      console.error('Error al crear usuario de sensei:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear usuario y perfil para un judoka
   */
  async createJudokaUser(nombres: string, apellidos: string): Promise<ApiResponse<{ userId: string }>> {
    try {
      // Generar email temporal único
      const tempEmail = `judoka_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.com`
      const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + 'A1!'

      // Crear usuario en auth.users usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            nombres,
            apellidos,
            user_type: 'judoka'
          }
        }
      })

      if (authError) {
        return { 
          success: false, 
          error: `Error al crear usuario: ${authError.message}` 
        }
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'Error: No se pudo crear el usuario' 
        }
      }

      const userId = authData.user.id

      // Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_type: 'judoka',
          nombres,
          apellidos,
          activo: true
        })

      if (profileError) {
        // Si falla crear el perfil, intentar continuar de todas formas
        console.warn('Error al crear perfil de usuario:', profileError.message)
        // El perfil se puede crear después manualmente
      }

      return { success: true, data: { userId } }
    } catch (error) {
      console.error('Error al crear usuario de judoka:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  }
}

