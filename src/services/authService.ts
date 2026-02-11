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
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single()
      
      if (profileError || !profileData) {
        console.error('Error al obtener perfil:', profileError)
        return {
          success: false,
          error: profileError?.message || 'Perfil de usuario no encontrado',
        }
      }

      // Obtener información del club y role-specific IDs si corresponde
      let clubInfo = { club_id: null, club_nombre: null }
      let senseiId = null
      let judokaId = null
      const userRole = profileData.rol || 'judoka'

      if (userRole === 'judoka') {
        const { data: judokaData } = await supabaseWithSession
          .from('judokas')
          .select('id, club_id')
          .eq('usuario_id', profileData.id)
          .single()
        
        if (judokaData) {
          judokaId = judokaData.id
          
          if (judokaData.club_id) {
            const { data: clubData } = await supabaseWithSession
              .from('clubes')
              .select('nombre_club')
              .eq('id', judokaData.club_id)
              .single()
              
            clubInfo = {
              club_id: judokaData.club_id,
              club_nombre: clubData?.nombre_club || null
            }
          }
        }
      } else if (userRole === 'sensei' || userRole === 'encargado') {
        // 1. Obtener datos del sensei primero (sin join para evitar problemas)
        const { data: senseiData } = await supabaseWithSession
          .from('senseis')
          .select('id, club_id')
          .eq('usuario_id', profileData.id)
          .single()
          
        if (senseiData) {
          senseiId = senseiData.id
          
          if (senseiData.club_id) {
            // 2. Si tiene club, obtener nombre del club
            const { data: clubData } = await supabaseWithSession
              .from('clubes')
              .select('nombre_club')
              .eq('id', senseiData.club_id)
              .single()
              
            clubInfo = {
              club_id: senseiData.club_id,
              club_nombre: clubData?.nombre_club || null
            }
          }
        }
      }

      // Construir nombre completo
      const nombreSolo = profileData.nombre || ''
      const apellidoPaterno = profileData.apellido_paterno || ''
      const apellidoMaterno = profileData.apellido_materno || ''

      const userData: User = {
        id: profileData.id,
        email: profileData.correo || '',
        nombres: nombreSolo,
        apellidos: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
        rol: userRole,
        club_id: clubInfo.club_id || null,
        club_nombre: clubInfo.club_nombre || null,
        sensei_id: senseiId,
        judoka_id: judokaId,
        avatar_url: profileData.avatar_url || null,
        fecha_nacimiento: profileData.fecha_nacimiento || null,
        numero_celular: profileData.numero_celular || null,
        genero: profileData.genero || null,
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
        .select('*')
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

      // Obtener información del club y role-specific IDs si corresponde
      let clubInfo = { club_id: null, club_nombre: null }
      let senseiId = null
      let judokaId = null
      const userRole = data.rol || 'judoka'

      if (userRole === 'judoka') {
        const { data: judokaData } = await supabase
          .from('judokas')
          .select('id, club_id')
          .eq('usuario_id', data.id)
          .single()
        
        if (judokaData) {
          judokaId = judokaData.id
          
          if (judokaData.club_id) {
            const { data: clubData } = await supabase
              .from('clubes')
              .select('nombre_club')
              .eq('id', judokaData.club_id)
              .single()
              
            clubInfo = {
              club_id: judokaData.club_id,
              club_nombre: clubData?.nombre_club || null
            }
          }
        }
      } else if (userRole === 'sensei' || userRole === 'encargado') {
        // 1. Obtener datos del sensei primero (sin join para evitar problemas)
        const { data: senseiData } = await supabase
          .from('senseis')
          .select('id, club_id')
          .eq('usuario_id', data.id)
          .single()
          
        if (senseiData) {
          senseiId = senseiData.id
          
          if (senseiData.club_id) {
            // 2. Si tiene club, obtener nombre del club
            const { data: clubData } = await supabase
              .from('clubes')
              .select('nombre_club')
              .eq('id', senseiData.club_id)
              .single()
              
            clubInfo = {
              club_id: senseiData.club_id,
              club_nombre: clubData?.nombre_club || null
            }
          }
        }
      }

      // Construir nombre completo
      const nombreSolo = data.nombre || ''
      const apellidoPaterno = data.apellido_paterno || ''
      const apellidoMaterno = data.apellido_materno || ''

      const userData: User = {
        id: data.id,
        email: data.correo || '',
        nombres: nombreSolo,
        apellidos: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
        rol: userRole,
        club_id: clubInfo.club_id || null,
        club_nombre: clubInfo.club_nombre || null,
        sensei_id: senseiId,
        judoka_id: judokaId,
        avatar_url: data.avatar_url || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        numero_celular: data.numero_celular || null,
        genero: data.genero || null,
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
        .select('*')
        .single()

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al actualizar el perfil',
        }
      }

      // Obtener información del club y role-specific IDs si corresponde
      let clubInfo = { club_id: null, club_nombre: null }
      let senseiId = null
      let judokaId = null
      const userRole = updatedData.rol || 'judoka'

      if (userRole === 'judoka') {
        const { data: judokaData } = await supabase
          .from('judokas')
          .select('id, club_id')
          .eq('usuario_id', updatedData.id)
          .single()
        
        if (judokaData) {
          judokaId = judokaData.id
          
          if (judokaData.club_id) {
            const { data: clubData } = await supabase
              .from('clubes')
              .select('nombre_club')
              .eq('id', judokaData.club_id)
              .single()
              
            clubInfo = {
              club_id: judokaData.club_id,
              club_nombre: clubData?.nombre_club || null
            }
          }
        }
      } else if (userRole === 'sensei' || userRole === 'encargado') {
        // 1. Obtener datos del sensei primero (sin join para evitar problemas)
        const { data: senseiData } = await supabase
          .from('senseis')
          .select('id, club_id')
          .eq('usuario_id', updatedData.id)
          .single()
          
        if (senseiData) {
          senseiId = senseiData.id
          
          if (senseiData.club_id) {
            // 2. Si tiene club, obtener nombre del club
            const { data: clubData } = await supabase
              .from('clubes')
              .select('nombre_club')
              .eq('id', senseiData.club_id)
              .single()
              
            clubInfo = {
              club_id: senseiData.club_id,
              club_nombre: clubData?.nombre_club || null
            }
          }
        }
      }

      const nombreSolo = updatedData.nombre || ''
      const apellidoPaterno = updatedData.apellido_paterno || ''
      const apellidoMaterno = updatedData.apellido_materno || ''

      return {
        success: true,
        data: {
          id: updatedData.id,
          email: updatedData.correo || '',
          nombres: nombreSolo,
          apellidos: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
          rol: userRole,
          club_id: clubInfo.club_id || null,
          club_nombre: clubInfo.club_nombre || null,
          sensei_id: senseiId,
          judoka_id: judokaId,
          avatar_url: updatedData.avatar_url || null,
          fecha_nacimiento: updatedData.fecha_nacimiento || null,
          numero_celular: updatedData.numero_celular || null,
          genero: updatedData.genero || null,
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



