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
  apellidos: string,
  rol: 'asociacion' | 'sensei' | 'arbitro' | 'judoka' | 'encargado',
  clubId?: string
): Promise<ApiResponse<{ userId: string }>> {
  try {
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        nombres,
        apellidos,
        rol,
        club_id: clubId,
      }),
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
      data: { userId: result.data.userId },
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
    apellidos: string, 
    email: string, 
    password: string
  ): Promise<ApiResponse<{ userId: string }>> {
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

      // Crear usuario usando Admin API (auto-confirmado)
      return await createUserWithAdminAPI(email, password, nombres, apellidos, 'arbitro')
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
    apellidos: string, 
    email: string, 
    password: string
  ): Promise<ApiResponse<{ userId: string }>> {
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

      // Crear usuario usando Admin API (auto-confirmado)
      return await createUserWithAdminAPI(email, password, nombres, apellidos, 'sensei')
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
    apellidos: string, 
    email: string, 
    password: string,
    clubId?: string
  ): Promise<ApiResponse<{ userId: string }>> {
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

      // Crear usuario usando Admin API (auto-confirmado)
      return await createUserWithAdminAPI(email, password, nombres, apellidos, 'encargado', clubId)
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
    apellidos: string, 
    email?: string, 
    password?: string,
    clubId?: string
  ): Promise<ApiResponse<{ userId: string }>> {
    try {
      // Si no se proporciona email, generar uno automático
      let finalEmail = email
      let finalPassword = password

      if (!finalEmail) {
        // Generar email automático basado en nombres y apellidos
        const nombreLimpio = nombres.toLowerCase().replace(/\s+/g, '')
        const apellidoLimpio = apellidos.toLowerCase().replace(/\s+/g, '')
        const timestamp = Date.now()
        finalEmail = `${nombreLimpio}.${apellidoLimpio}.${timestamp}@judoka.local`
      }

      if (!finalPassword) {
        // Generar contraseña temporal aleatoria
        finalPassword = `Judoka${Date.now()}!`
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(finalEmail)) {
        return {
          success: false,
          error: 'El formato del email no es válido'
        }
      }

      // Crear usuario usando Admin API
      return await createUserWithAdminAPI(finalEmail, finalPassword, nombres, apellidos, 'judoka', clubId)
    } catch (error) {
      console.error('Error al crear usuario de judoka:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
      return { success: false, error: errorMessage }
    }
  }
}

