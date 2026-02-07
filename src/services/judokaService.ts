import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { ApiResponse } from '@/types'
import { userService } from './userService'

// Helper para obtener el cliente correcto (navegador si está disponible, básico si no)
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

const selectJudokasWithUsuario = '*, usuarios:usuario_id(nombre, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, ci, genero, activo, avatar_url)'

function mapJudokaRow(row: any): Judoka {
  const u = row.usuarios
  const nombres = u?.nombre ?? ''
  const apellidoPaterno = u?.apellido_paterno ?? ''
  const apellidoMaterno = u?.apellido_materno ?? ''
  const apellidos = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ')
  return {
    ...row,
    nombres,
    apellidos,
    apellido_paterno: apellidoPaterno,
    apellido_materno: apellidoMaterno,
    fecha_nacimiento: u?.fecha_nacimiento ?? '',
    numero_celular: u?.numero_celular ?? null,
    ci: u?.ci ?? null,
    genero: u?.genero ?? null,
    activo: u?.activo ?? true,
    avatar_url: u?.avatar_url ?? null,
    usuarios: undefined,
  }
}

export const judokaService = {
  /**
   * Obtener todos los judokas
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Judoka[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        // Filtramos en memoria por ahora para evitar problemas con joins
        const { data: activeData, error: activeError } = await query
        if (activeError) throw activeError
        
        const mapped = (activeData || [])
          .map(mapJudokaRow)
          .filter(j => j.activo)
          
        return { success: true, data: mapped }
      }

      const { data, error } = await query
      if (error) throw error

      const mapped = (data || []).map(mapJudokaRow)
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener judokas por club
   */
  async getByClub(clubId: string): Promise<ApiResponse<Judoka[]>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped = (data || [])
        .map(mapJudokaRow)
        .filter(j => j.activo) // Filtrar siempre activos por defecto en getByClub

      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener judokas por entrenador
   */
  async getByEntrenador(entrenadorId: string): Promise<ApiResponse<Judoka[]>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .eq('entrenador_id', entrenadorId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped = (data || [])
        .map(mapJudokaRow)
        .filter(j => j.activo) // Filtrar siempre activos por defecto en getByEntrenador

      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un judoka por ID
   */
  async getById(id: string): Promise<ApiResponse<Judoka>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data: data ? mapJudokaRow(data) : data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear un nuevo judoka
   */
  async create(judoka: JudokaCreate): Promise<ApiResponse<Judoka>> {
    try {
      let userId = judoka.usuario_id

      // Si no hay usuario_id o es temporal, crear usuario y perfil automáticamente
      if (!userId || userId === 'temp-user-id') {
        const userResult = await userService.createJudokaUser(
          judoka.nombres,
          judoka.apellido_paterno,
          judoka.apellido_materno,
          judoka.email, // email (opcional)
          judoka.password, // password (opcional)
          undefined, // clubId
          judoka.fecha_nacimiento,
          judoka.numero_celular,
          judoka.genero
        )
        
        if (!userResult.success || !userResult.data) {
          return { 
            success: false, 
            error: userResult.error || 'Error al crear el usuario del judoka' 
          }
        }

        userId = userResult.data.usuarioId
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        return { 
          success: false, 
          error: 'Error: El usuario_id debe ser un UUID válido.' 
        }
      }

      const client = getSupabaseClient()
      const insertPayload = {
        usuario_id: userId,
        club_id: judoka.club_id ?? null,
        entrenador_id: judoka.entrenador_id ?? null,
        categoria: judoka.categoria ?? null,
        peso_competitivo: judoka.peso_competitivo ?? null,
        cinturon_actual: judoka.cinturon_actual ?? null,
      }

      const { data, error } = await client
        .from('judokas')
        .insert(insertPayload)
        .select()
        .single()

      // Si se proporcionó avatar_url, activo, numero_celular, ci o genero, actualizar el usuario
      if (userId && (judoka.avatar_url || judoka.activo !== undefined || judoka.numero_celular !== undefined || judoka.ci !== undefined || judoka.genero !== undefined)) {
        const userUpdate: Record<string, unknown> = {}
        if (judoka.avatar_url) userUpdate.avatar_url = judoka.avatar_url
        if (judoka.activo !== undefined) userUpdate.activo = judoka.activo
        if (judoka.numero_celular !== undefined) userUpdate.numero_celular = judoka.numero_celular
        if (judoka.ci !== undefined) userUpdate.ci = judoka.ci
        if (judoka.genero !== undefined) userUpdate.genero = judoka.genero
        
        if (Object.keys(userUpdate).length > 0) {
          await client.from('usuarios').update(userUpdate).eq('id', userId)
        }
      }

      if (error) {
        // Mejorar el mensaje de error
        let errorMessage = error.message
        
        if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
          if (error.message.includes('usuario_id')) {
            errorMessage = 'Error: El usuario_id no existe en usuarios. Por favor, primero crea el usuario en el sistema.'
          } else if (error.message.includes('club_id')) {
            errorMessage = 'Error: El club_id no existe. Por favor, selecciona un club válido.'
          } else if (error.message.includes('entrenador_id')) {
            errorMessage = 'Error: El entrenador_id no existe. Por favor, selecciona un entrenador válido.'
          } else {
            errorMessage = 'Error: Hay un problema con las relaciones de la base de datos.'
          }
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Error: Ya existe un judoka con este usuario_id.'
        } else if (error.message.includes('null value') || error.message.includes('not null')) {
          errorMessage = 'Error: Faltan campos requeridos. Por favor, completa todos los campos obligatorios.'
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Error: Los datos no cumplen con las validaciones de la base de datos.'
        }
        
        return { success: false, error: errorMessage }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error al crear judoka:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el judoka'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un judoka
   */
  async update(id: string, judoka: JudokaUpdate): Promise<ApiResponse<Judoka>> {
    try {
      const client = getSupabaseClient()
      const { nombres, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, ci, genero, activo, avatar_url, ...judokaPayload } = judoka as JudokaUpdate & { numero_celular?: string, ci?: string, genero?: any }

      const { data, error } = await client
        .from('judokas')
        .update(judokaPayload)
        .eq('id', id)
        .select(selectJudokasWithUsuario)
        .single()

      if (error) throw error

      if (data?.usuario_id && (nombres !== undefined || apellido_paterno !== undefined || apellido_materno !== undefined || fecha_nacimiento !== undefined || activo !== undefined || avatar_url !== undefined || numero_celular !== undefined || ci !== undefined || genero !== undefined)) {
        const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
        if (nombres !== undefined) userUpdate.nombre = nombres
        if (apellido_paterno !== undefined) userUpdate.apellido_paterno = apellido_paterno
        if (apellido_materno !== undefined) userUpdate.apellido_materno = apellido_materno
        if (fecha_nacimiento !== undefined) userUpdate.fecha_nacimiento = fecha_nacimiento
        if (activo !== undefined) userUpdate.activo = activo
        if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
        if (numero_celular !== undefined) userUpdate.numero_celular = numero_celular
        if (ci !== undefined) userUpdate.ci = ci
        if (genero !== undefined) userUpdate.genero = genero
        
        await client.from('usuarios').update(userUpdate).eq('id', data.usuario_id)
        
        // Refresh the returned data to include updated user info
        if (activo !== undefined || avatar_url !== undefined || numero_celular !== undefined || ci !== undefined || genero !== undefined) {
           data.usuarios.activo = activo !== undefined ? activo : data.usuarios.activo
           data.usuarios.avatar_url = avatar_url !== undefined ? avatar_url : data.usuarios.avatar_url
           data.usuarios.numero_celular = numero_celular !== undefined ? numero_celular : data.usuarios.numero_celular
           data.usuarios.ci = ci !== undefined ? ci : data.usuarios.ci
           data.usuarios.genero = genero !== undefined ? genero : data.usuarios.genero
        }
      }

      const mapped = data ? mapJudokaRow(data) : data
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un judoka (soft delete - marca como inactivo)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      // Get user_id first
      const { data, error: getError } = await client
        .from('judokas')
        .select('usuario_id')
        .eq('id', id)
        .single()
        
      if (getError || !data) throw getError || new Error('Judoka not found')

      const { error } = await client
        .from('usuarios')
        .update({ activo: false })
        .eq('id', data.usuario_id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Restaurar un judoka (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Judoka>> {
    try {
      const client = getSupabaseClient()
      
      // Get user_id first
      const { data: judokaData, error: getError } = await client
        .from('judokas')
        .select('usuario_id')
        .eq('id', id)
        .single()
        
      if (getError || !judokaData) throw getError || new Error('Judoka not found')

      const { error } = await client
        .from('usuarios')
        .update({ activo: true })
        .eq('id', judokaData.usuario_id)

      if (error) throw error
      
      // Return full object
      return await this.getById(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}

