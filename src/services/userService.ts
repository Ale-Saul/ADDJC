import { ApiResponse } from '@/types/globales'

/**
 * Crear usuario usando Admin API (auto-confirmado)
 * Esto evita el problema de "Email not confirmed"
 */
async function createUserWithAdminAPI(
  email: string,
  password: string,
  nombres: string,
  apellido_paterno: string,
  apellido_materno: string,
  rol: 'admin' | 'asociacion' | 'sensei' | 'arbitro' | 'judoka' | 'encargado',
  fechaNacimiento?: string | null,
  numeroCelular?: string | null,
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null,
  ci?: string | null,
  ci_extension?: string | null
): Promise<ApiResponse<{ userId: string; usuarioId?: string }>> {
  try {
    const body: Record<string, unknown> = {
      email,
      password,
      nombres,
      apellido_paterno,
      apellido_materno,
      rol,
      genero,
      ci,
      ci_extension,
    }
    if (fechaNacimiento != null && fechaNacimiento !== '') {
      body.fecha_nacimiento = fechaNacimiento
    }
    if (numeroCelular != null && numeroCelular !== '') {
      body.numero_celular = numeroCelular
    }
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (!result.success) {
      // Traducir errores comunes de Supabase Auth
      let errorMessage = result.error || 'Error al crear usuario'
      
      if (errorMessage.includes('A user with this email address has already been registered')) {
        errorMessage = 'Ya existe un usuario registrado con este correo electrónico'
      } else if (errorMessage.includes('User already exists')) {
        errorMessage = 'El usuario ya existe'
      } else if (errorMessage.includes('Password should be at least 6 characters')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres'
      } else if (errorMessage.includes('usuarios_ci_ci_extension_key') || errorMessage.includes('Carnet de Identidad')) {
        errorMessage = errorMessage.includes('Carnet de Identidad') ? errorMessage : 'Ya existe un usuario registrado con este Carnet de Identidad y extensión'
      }

      // Si hay detalles del error en el JSON, los mostramos
      const detailedError = result.details ? `${errorMessage} (${result.details})` : errorMessage
      return {
        success: false,
        error: detailedError,
      }
    }

    return {
      success: true,
      data: {
        userId: result.data.userId,
        usuarioId: result.data.usuarioId ?? result.data.userId,
      },
    }
  } catch (error) {
    console.error('Error al crear usuario con Admin API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const userService = {
  /**
   * Crear usuario y perfil para un árbitro
   */
  async createArbitroUser(
    nombres: string,
    apellido_paterno: string,
    apellido_materno: string,
    email: string,
    password?: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null,
    ci?: string | null,
    ci_extension?: string | null
  ): Promise<ApiResponse<{ userId: string; usuarioId?: string }>> {
    try {
      // Validar email
      if (!email) {
        return {
          success: false,
          error: 'El email es requerido'
        }
      }

      // Generar contraseña si no se proporciona
      let finalPassword = password
      if (!finalPassword && ci) {
        finalPassword = `Judo.${ci}${ci_extension ? `-${ci_extension}` : ''}`
      } else if (!finalPassword) {
        return {
          success: false,
          error: 'La contraseña es requerida si no hay CI para generarla'
        }
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'El formato del email no es válido'
        }
      }

      // Validar longitud de contraseña
      if (finalPassword.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        }
      }

      // Crear en auth.users; el trigger crea la fila en tabla usuarios (nombre, apellidos, correo, fecha_nacimiento, rol).
      // usuarioId es el id de la fila en usuarios; se usa en arbitros.usuario_id (FK a usuarios.id).
      const result = await createUserWithAdminAPI(email, finalPassword, nombres, apellido_paterno, apellido_materno, 'arbitro', fecha_nacimiento, numero_celular, genero, ci, ci_extension)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId: usuarioId as string } }
    } catch (error) {
      console.error('Error al crear usuario de árbitro:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear usuario y perfil para un sensei
   */
  async createSenseiUser(
    nombres: string,
    apellido_paterno: string,
    apellido_materno: string,
    email: string,
    password?: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null,
    ci?: string | null,
    ci_extension?: string | null
  ): Promise<ApiResponse<{ userId: string; usuarioId?: string }>> {
    try {
      if (!email) {
        return { success: false, error: 'El email es requerido' }
      }

      // Generar contraseña si no se proporciona
      let finalPassword = password
      if (!finalPassword && ci) {
        finalPassword = `Judo.${ci}${ci_extension ? `-${ci_extension}` : ''}`
      } else if (!finalPassword) {
        return {
          success: false,
          error: 'La contraseña es requerida si no hay CI para generarla'
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      if (finalPassword.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
      }
      const result = await createUserWithAdminAPI(email, finalPassword, nombres, apellido_paterno, apellido_materno, 'sensei', fecha_nacimiento, numero_celular, genero, ci, ci_extension)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId: usuarioId as string } }
    } catch (error) {
      console.error('Error al crear usuario de sensei:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear usuario y perfil para un encargado (Director Técnico)
   */
  async createEncargadoUser(
    nombres: string,
    apellido_paterno: string,
    apellido_materno: string,
    email: string,
    password?: string,
    clubId?: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null,
    ci?: string | null,
    ci_extension?: string | null
  ): Promise<ApiResponse<{ userId: string; usuarioId?: string }>> {
    try {
      if (!email) {
        return { success: false, error: 'El email es requerido' }
      }

      // Generar contraseña si no se proporciona
      let finalPassword = password
      if (!finalPassword && ci) {
        finalPassword = `Judo.${ci}${ci_extension ? `-${ci_extension}` : ''}`
      } else if (!finalPassword) {
        return {
          success: false,
          error: 'La contraseña es requerida si no hay CI para generarla'
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      if (finalPassword.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        }
      }

      const result = await createUserWithAdminAPI(email, finalPassword, nombres, apellido_paterno, apellido_materno, 'encargado', fecha_nacimiento, numero_celular, genero, ci, ci_extension)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId: usuarioId as string } }
    } catch (error) {
      console.error('Error al crear usuario de encargado:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear usuario y perfil para un judoka
   */
  async createJudokaUser(
    nombres: string,
    apellido_paterno: string,
    apellido_materno: string,
    email?: string,
    password?: string,
    clubId?: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null,
    ci?: string | null,
    ci_extension?: string | null
  ): Promise<ApiResponse<{ userId: string; usuarioId?: string }>> {
    try {
      let finalEmail = email
      let finalPassword = password
      if (!finalEmail) {
        const nombreLimpio = nombres.toLowerCase().replace(/\s+/g, '')
        const apellidoLimpio = (apellido_paterno + apellido_materno).toLowerCase().replace(/\s+/g, '')
        const timestamp = Date.now()
        finalEmail = `${nombreLimpio}.${apellidoLimpio}.${timestamp}@judoka.local`
      }
      
      // Generar contraseña si no se proporciona
      if (!finalPassword && ci) {
        finalPassword = `Judo.${ci}${ci_extension ? `-${ci_extension}` : ''}`
      } else if (!finalPassword) {
        finalPassword = `Judoka${Date.now()}!`
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(finalEmail)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      const result = await createUserWithAdminAPI(finalEmail, finalPassword, nombres, apellido_paterno, apellido_materno, 'judoka', fecha_nacimiento, numero_celular, genero, ci, ci_extension)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId: usuarioId as string } }
    } catch (error) {
      console.error('Error al crear usuario de judoka:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear usuario y perfil para un miembro de la asociación
   */
  async createAsociacionUser(
    nombres: string,
    apellido_paterno: string,
    apellido_materno: string,
    email: string,
    password?: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null,
    ci?: string | null,
    ci_extension?: string | null
  ): Promise<ApiResponse<{ userId: string; usuarioId?: string }>> {
    try {
      if (!email) {
        return { success: false, error: 'El email es requerido' }
      }

      // Generar contraseña si no se proporciona
      let finalPassword = password
      if (!finalPassword && ci) {
        finalPassword = `Judo.${ci}${ci_extension ? `-${ci_extension}` : ''}`
      } else if (!finalPassword) {
        return {
          success: false,
          error: 'La contraseña es requerida si no hay CI para generarla'
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      if (finalPassword.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
      }
      const result = await createUserWithAdminAPI(email, finalPassword, nombres, apellido_paterno, apellido_materno, 'asociacion', fecha_nacimiento, numero_celular, genero, ci, ci_extension)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId: usuarioId as string } }
    } catch (error) {
      console.error('Error al crear usuario de asociación:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  }
}



