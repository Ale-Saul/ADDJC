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

      // Crear un nuevo cliente con la sesión actualizada
      const supabaseWithSession = createClient()
      await supabaseWithSession.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      // Obtener el perfil del usuario con el cliente autenticado
      const { data: profileData, error: profileError } = await supabaseWithSession
        .from('usuarios')
        .select(`
          *,
          clubes:club_id (
            nombre_club
          )
        `)
        .eq('auth_user_id', data.user.id)
        .single()
      
      if (profileError || !profileData) {
        console.error('Error al obtener perfil:', profileError)
        return {
          success: false,
          error: profileError?.message || 'Perfil de usuario no encontrado',
        }
      }

      // Construir nombre completo
      const nombreCompleto = `${profileData.nombre} ${profileData.apellido_paterno} ${profileData.apellido_materno}`.trim()

      const userData: User = {
        id: profileData.id,
        email: profileData.correo || '',
        nombres: nombreCompleto,
        apellidos: `${profileData.apellido_paterno} ${profileData.apellido_materno}`.trim(),
        rol: profileData.rol || 'judoka',
        club_id: profileData.club_id || null,
        club_nombre: profileData.clubes?.nombre_club || null,
        avatar_url: profileData.avatar_url || null,
        activo: profileData.activo ?? true,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      }

      return {
        success: true,
        data: {
          user: userData,
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
   * Obtener el perfil del usuario desde la tabla usuarios
   */
  async getUserProfile(authUserId: string): Promise<ApiResponse<User>> {
    try {
      const supabase = createClient()
      
      // Buscar usuario por auth_user_id en la tabla usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          clubes:club_id (
            nombre_club
          )
        `)
        .eq('auth_user_id', authUserId)
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

      // Construir nombre completo
      const nombreCompleto = `${data.nombre} ${data.apellido_paterno} ${data.apellido_materno}`.trim()

      const userData: User = {
        id: data.id,
        email: data.correo || '',
        nombres: nombreCompleto,
        apellidos: `${data.apellido_paterno} ${data.apellido_materno}`.trim(),
        rol: data.rol || 'judoka',
        club_id: data.club_id || null,
        club_nombre: data.clubes?.nombre_club || null,
        avatar_url: data.avatar_url || null,
        activo: data.activo ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      return {
        success: true,
        data: userData,
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

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const supabase = createClient()
      
      // Campos permitidos para actualización por el usuario
      const updates: any = {
        updated_at: new Date().toISOString(),
      }
      
      if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url
      
      // Nota: Email (correo), nombre, apellidos, rol y club_id no se actualizan aquí por seguridad
      
      const { data: updatedData, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', userId)
        .select(`
          *,
          clubes:club_id (
            nombre_club
          )
        `)
        .single()

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al actualizar el perfil',
        }
      }

      const nombreCompleto = `${updatedData.nombre} ${updatedData.apellido_paterno} ${updatedData.apellido_materno}`.trim()

      return {
        success: true,
        data: {
          id: updatedData.id,
          email: updatedData.correo || '',
          nombres: nombreCompleto,
          apellidos: `${updatedData.apellido_paterno} ${updatedData.apellido_materno}`.trim(),
          rol: updatedData.rol || 'judoka',
          club_id: updatedData.club_id || null,
          club_nombre: updatedData.clubes?.nombre_club || null,
          avatar_url: updatedData.avatar_url || null,
          activo: updatedData.activo ?? true,
          created_at: updatedData.created_at,
          updated_at: updatedData.updated_at,
        },
      }
    } catch (error) {
      console.error('Error en updateProfile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al actualizar perfil',
      }
    }
  },

  /**
   * Subir imagen de avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<string>> {
    try {
      const supabase = createClient()
      
      // 1. Validar archivo (tamaño y tipo)
      if (file.size > 2 * 1024 * 1024) { // 2MB
        return {
          success: false,
          error: 'La imagen no debe superar los 2MB',
        }
      }

      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'El archivo debe ser una imagen',
        }
      }

      // 2. Subir archivo al bucket 'avatars'
      // Nota: Esto requiere que el bucket 'avatars' exista en Supabase y tenga policies públicas
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadError) {
        console.error('Error subiendo avatar:', uploadError)
        return {
          success: false,
          error: 'Error al subir la imagen. Asegúrate de que el bucket "avatars" exista y sea público.'
        }
      }

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 4. Actualizar perfil con la nueva URL
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.warn('Imagen subida pero falló actualización de perfil:', updateError)
        // No retornamos error aquí porque la imagen sí se subió, solo advertimos
      }

      return {
        success: true,
        data: publicUrl
      }
    } catch (error) {
      console.error('Error en uploadAvatar:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al subir avatar'
      }
    }
  },
}



