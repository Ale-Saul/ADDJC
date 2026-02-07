import { supabase } from '@/lib/supabase'
import { ApiResponse } from '@/types'

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
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
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
      return {
        success: false,
        error: result.error || 'Error al crear usuario',
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
    password: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  ): Promise<ApiResponse<{ userId: string; usuarioId: string }>> {
    try {
      // Validar email y password
      if (!email || !password) {
        return {
          success: false,
          error: 'Email y contraseña son requeridos'
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
      if (password.length < 8) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 8 caracteres'
        }
      }

      // Crear en auth.users; el trigger crea la fila en tabla usuarios (nombre, apellidos, correo, fecha_nacimiento, rol).
      // usuarioId es el id de la fila en usuarios; se usa en arbitros.usuario_id (FK a usuarios.id).
      const result = await createUserWithAdminAPI(email, password, nombres, apellido_paterno, apellido_materno, 'arbitro', fecha_nacimiento, numero_celular, genero)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId } }
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
    password: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  ): Promise<ApiResponse<{ userId: string; usuarioId: string }>> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email y contraseña son requeridos' }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      if (password.length < 8) {
        return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
      }
      const result = await createUserWithAdminAPI(email, password, nombres, apellido_paterno, apellido_materno, 'sensei', fecha_nacimiento, numero_celular, genero)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId } }
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
    password: string,
    clubId?: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  ): Promise<ApiResponse<{ userId: string; usuarioId: string }>> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email y contraseña son requeridos' }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      if (password.length < 8) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 8 caracteres'
        }
      }

      const result = await createUserWithAdminAPI(email, password, nombres, apellido_paterno, apellido_materno, 'encargado', fecha_nacimiento, numero_celular, genero)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId } }
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
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  ): Promise<ApiResponse<{ userId: string; usuarioId: string }>> {
    try {
      let finalEmail = email
      let finalPassword = password
      if (!finalEmail) {
        const nombreLimpio = nombres.toLowerCase().replace(/\s+/g, '')
        const apellidoLimpio = (apellido_paterno + apellido_materno).toLowerCase().replace(/\s+/g, '')
        const timestamp = Date.now()
        finalEmail = `${nombreLimpio}.${apellidoLimpio}.${timestamp}@judoka.local`
      }
      if (!finalPassword) {
        finalPassword = `Judoka${Date.now()}!`
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(finalEmail)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      const result = await createUserWithAdminAPI(finalEmail, finalPassword, nombres, apellido_paterno, apellido_materno, 'judoka', fecha_nacimiento, numero_celular, genero)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId } }
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
    password: string,
    fecha_nacimiento?: string | null,
    numero_celular?: string | null,
    genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  ): Promise<ApiResponse<{ userId: string; usuarioId: string }>> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email y contraseña son requeridos' }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'El formato del email no es válido' }
      }
      if (password.length < 8) {
        return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
      }
      const result = await createUserWithAdminAPI(email, password, nombres, apellido_paterno, apellido_materno, 'asociacion', fecha_nacimiento, numero_celular, genero)
      if (!result.success) return result
      const usuarioId = result.data?.usuarioId ?? result.data?.userId
      return { success: true, data: { userId: result.data!.userId, usuarioId } }
    } catch (error) {
      console.error('Error al crear usuario de asociación:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  }
}

