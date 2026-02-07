import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { ApiResponse } from '@/types'
import { userService } from './userService'

function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

function mapSenseiRow(row: any): Sensei {
  const u = row.usuarios
  const nombres = u?.nombre ?? ''
  const apellidoP = u?.apellido_paterno ?? ''
  const apellidoM = u?.apellido_materno ?? ''
  return {
    ...row,
    nombres,
    apellidos: [apellidoP, apellidoM].filter(Boolean).join(' '),
    fecha_nacimiento: u?.fecha_nacimiento ?? null,
    numero_celular: u?.numero_celular ?? null,
    genero: u?.genero ?? null,
    activo: u?.activo ?? true,
    avatar_url: u?.avatar_url ?? null,
    certificacion: row.certificacion?.nombre_certificacion ?? null,
    certificacion_id: row.certificacion_id ?? null,
  }
}

export const senseiService = {
  /**
   * Obtener todos los senseis
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Sensei[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('senseis')
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, genero, activo, avatar_url)')
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        // Filter needs to check joined table... Supabase simple filter on joined column is tricky with !inner,
        // but here we select. We might need client-side filter or !inner.
        // If we use !inner on usuarios, we can filter by usuarios.activo.
        // But the previous code query.eq('activo', true) assumed column on senseis.
        // Since we dropped it, we must filter on usuarios.activo.
        // Supabase join filter syntax: .eq('usuarios.activo', true) (if enabled) or use !inner join.
        // Let's try to filter in memory for now to be safe or use !inner.
        // .select('..., usuarios!inner(...)').eq('usuarios.activo', true)
        // However, map function handles it.
      }
      // Re-implement filtering below.


      const { data, error } = await query

      if (error) throw error

      let mapped = (data || []).map((row: any) => mapSenseiRow(row))
      
      if (!includeInactive) {
        mapped = mapped.filter(s => s.activo)
      }
      
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener senseis por club
   */
  async getByClub(clubId: string): Promise<ApiResponse<Sensei[]>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('senseis')
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, genero, activo, avatar_url)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped = (data || [])
        .map((row: any) => mapSenseiRow(row))
        .filter(s => s.activo)

      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un sensei por ID
   */
  async getById(id: string): Promise<ApiResponse<Sensei>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('senseis')
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, genero, activo, avatar_url)')
        .eq('id', id)
        .single()

      if (error) throw error

      const mapped = mapSenseiRow(data)
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear un nuevo sensei
   */
  async create(sensei: SenseiCreate): Promise<ApiResponse<Sensei>> {
    try {
      let userId = sensei.usuario_id

      // Si no hay usuario_id o es temporal, crear usuario y perfil automáticamente
      if (!userId || userId === 'temp-user-id') {
        // Validar que se proporcionen email y password
        if (!sensei.email || !sensei.password) {
          return {
            success: false,
            error: 'Email y contraseña son requeridos para crear un nuevo sensei'
          }
        }

        // Determinar qué función usar según si es encargado o sensei normal
        const userResult = sensei.isEncargado
          ? await userService.createEncargadoUser(
              sensei.nombres,
              sensei.apellido_paterno,
              sensei.apellido_materno,
              sensei.email!,
              sensei.password!,
              sensei.club_id || undefined,
              sensei.fecha_nacimiento,
              sensei.numero_celular,
              sensei.genero
            )
          : await userService.createSenseiUser(
              sensei.nombres,
              sensei.apellido_paterno,
              sensei.apellido_materno,
              sensei.email!,
              sensei.password!,
              sensei.fecha_nacimiento,
              sensei.numero_celular,
              sensei.genero
            )
        
        if (!userResult.success || !userResult.data) {
          return { 
            success: false, 
            error: userResult.error || 'Error al crear el usuario del sensei' 
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

      const { email, password, isEncargado, certificacion, nombres, apellido_paterno, apellido_materno, activo, avatar_url, fecha_nacimiento, numero_celular, genero, ...senseiData } = sensei as SenseiCreate & { certificacion?: string | null, numero_celular?: string, genero?: any }
      const senseiConUsuario = {
        ...senseiData,
        usuario_id: userId,
        certificacion_id: sensei.certificacion_id ?? null,
      }

      const client = getSupabaseClient()
      const { data, error } = await client
        .from('senseis')
        .insert(senseiConUsuario)
        .select('*, certificacion:certificaciones(nombre_certificacion)')
        .single()

      if (error) {
        // Mejorar el mensaje de error
        let errorMessage = error.message
        // ... (resto del bloque error)
        
        return { success: false, error: errorMessage }
      }

      // Si se proporcionó activo, avatar_url, fecha_nacimiento, etc en create, actualizar usuario
      if (data && (activo !== undefined || avatar_url !== undefined || fecha_nacimiento !== undefined || numero_celular !== undefined || sensei.ci !== undefined || genero !== undefined)) {
        const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
        if (activo !== undefined) userUpdate.activo = activo
        if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
        if (fecha_nacimiento !== undefined) userUpdate.fecha_nacimiento = fecha_nacimiento
        if (numero_celular !== undefined) userUpdate.numero_celular = numero_celular
        if (sensei.ci !== undefined) userUpdate.ci = sensei.ci
        if (genero !== undefined) userUpdate.genero = genero
        
        if (Object.keys(userUpdate).length > 1) {
          await client.from('usuarios').update(userUpdate).eq('id', userId)
        }
      }

      const mapped = data ? {
        ...data,
        certificacion: data.certificacion?.nombre_certificacion ?? null,
        certificacion_id: data.certificacion_id ?? null,
        activo: activo ?? true,
        avatar_url: avatar_url ?? null,
        // Ojo: data no tiene fecha_nacimiento ni genero, habría que retornarlos o confiar en getById luego
        // Para simplificar, retornamos lo que tenemos
        fecha_nacimiento: fecha_nacimiento ?? null,
        numero_celular: numero_celular ?? null,
        ci: sensei.ci ?? null,
        genero: genero ?? null,
      } : data
      return { success: true, data: mapped }
    } catch (error) {
      console.error('Error al crear sensei:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el sensei'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un sensei
   */
  async update(id: string, sensei: SenseiUpdate): Promise<ApiResponse<Sensei>> {
    try {
      const client = getSupabaseClient()
      const { certificacion, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, genero, activo, avatar_url, ...senseiPayload } = sensei as SenseiUpdate & { certificacion?: string | null, numero_celular?: string, genero?: any }
      const { data, error } = await client
        .from('senseis')
        .update(senseiPayload)
        .eq('id', id)
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, genero, activo, avatar_url)')
        .single()

      if (error) throw error

      if (data?.usuario_id) {
        const userUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (nombres !== undefined) userUpdate.nombre = nombres
        if (apellido_paterno !== undefined) userUpdate.apellido_paterno = apellido_paterno
        if (apellido_materno !== undefined) userUpdate.apellido_materno = apellido_materno
        if (fecha_nacimiento !== undefined) userUpdate.fecha_nacimiento = fecha_nacimiento
        if (numero_celular !== undefined) userUpdate.numero_celular = numero_celular
        if (sensei.ci !== undefined) userUpdate.ci = sensei.ci
        if (genero !== undefined) userUpdate.genero = genero
        if (activo !== undefined) userUpdate.activo = activo
        if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
        if (Object.keys(userUpdate).length > 1) {
          await client.from('usuarios').update(userUpdate).eq('id', data.usuario_id)
          
          // Refresh data for return
          if (data.usuarios) {
              if (fecha_nacimiento !== undefined) data.usuarios.fecha_nacimiento = fecha_nacimiento
              if (numero_celular !== undefined) data.usuarios.numero_celular = numero_celular
              if (sensei.ci !== undefined) data.usuarios.ci = sensei.ci
              if (genero !== undefined) data.usuarios.genero = genero
              if (activo !== undefined) data.usuarios.activo = activo
              if (avatar_url !== undefined) data.usuarios.avatar_url = avatar_url
          }
        }
      }

      const mapped = data ? mapSenseiRow(data) : (data as Sensei)
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un sensei de forma real (hard delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      // Obtener usuario_id primero
      const { data: sensei, error: getError } = await client
        .from('senseis')
        .select('usuario_id')
        .eq('id', id)
        .single()

      if (getError) throw getError
      if (!sensei) {
        return { success: false, error: 'Sensei no encontrado' }
      }

      // Llamar a la API para eliminar el usuario completo
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: sensei.usuario_id }),
      })

      const result = await response.json()
      if (!result.success) {
        return { success: false, error: result.error || 'Error al eliminar el sensei' }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Restaurar un sensei (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Sensei>> {
    try {
      const client = getSupabaseClient()
      
      // Get user_id first
      const { data: senseiData, error: getError } = await client
        .from('senseis')
        .select('usuario_id')
        .eq('id', id)
        .single()
        
      if (getError || !senseiData) throw getError || new Error('Sensei not found')

      const { error } = await client
        .from('usuarios')
        .update({ activo: true })
        .eq('id', senseiData.usuario_id)

      if (error) throw error
      
      return await this.getById(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}

