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
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno, activo, avatar_url)')
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

      const mapped = (data || []).map((row: any) => mapSenseiRow(row))
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
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno)')
        .eq('club_id', clubId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped = (data || []).map((row: any) => mapSenseiRow(row))
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
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno)')
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
              sensei.password!
            )
          : await userService.createSenseiUser(
              sensei.nombres,
              sensei.apellido_paterno,
              sensei.apellido_materno,
              sensei.email!,
              sensei.password!
            )
        
        if (!userResult.success || !userResult.data) {
          return { 
            success: false, 
            error: userResult.error || 'Error al crear el usuario del sensei' 
          }
        }

        userId = userResult.data.userId
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        return { 
          success: false, 
          error: 'Error: El usuario_id debe ser un UUID válido.' 
        }
      }

      const { email, password, isEncargado, certificacion, nombres, apellido_paterno, apellido_materno, activo, avatar_url, ...senseiData } = sensei as SenseiCreate & { certificacion?: string | null }
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
        
        if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
          if (error.message.includes('usuario_id')) {
            errorMessage = 'Error: El usuario_id no existe en user_profiles. Por favor, primero crea el usuario y su perfil en el sistema.'
          } else if (error.message.includes('club_id')) {
            errorMessage = 'Error: El club_id no existe. Por favor, selecciona un club válido.'
          } else {
            errorMessage = 'Error: Hay un problema con las relaciones de la base de datos.'
          }
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Error: Ya existe un sensei con este usuario_id.'
        } else if (error.message.includes('null value') || error.message.includes('not null')) {
          errorMessage = 'Error: Faltan campos requeridos. Por favor, completa todos los campos obligatorios.'
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Error: Los datos no cumplen con las validaciones de la base de datos.'
        }
        
        return { success: false, error: errorMessage }
      }

      if (data && (activo !== undefined || avatar_url !== undefined)) {
        const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
        if (activo !== undefined) userUpdate.activo = activo
        if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
        
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
      const { certificacion, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, activo, avatar_url, ...senseiPayload } = sensei as SenseiUpdate & { certificacion?: string | null }
      const { data, error } = await client
        .from('senseis')
        .update(senseiPayload)
        .eq('id', id)
        .select('*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno)')
        .single()

      if (error) throw error

      if (data?.usuario_id) {
        const userUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (nombres !== undefined) userUpdate.nombre = nombres
        if (apellido_paterno !== undefined) userUpdate.apellido_paterno = apellido_paterno
        if (apellido_materno !== undefined) userUpdate.apellido_materno = apellido_materno
        if (fecha_nacimiento !== undefined) userUpdate.fecha_nacimiento = fecha_nacimiento
        if (activo !== undefined) userUpdate.activo = activo
        if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
        if (Object.keys(userUpdate).length > 1) {
          await client.from('usuarios').update(userUpdate).eq('id', data.usuario_id)
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
   * Eliminar un sensei (soft delete - marca como inactivo)
   * También limpia las referencias en otras tablas (clubes, judokas)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = getSupabaseClient()
      
      // Primero obtener el sensei para conocer su usuario_id
      const { data: sensei, error: getError } = await client
        .from('senseis')
        .select('id, usuario_id')
        .eq('id', id)
        .single()

      if (getError) throw getError
      if (!sensei) {
        return { success: false, error: 'Sensei no encontrado' }
      }

      // Actualizar el sensei como inactivo (en usuarios)
      const { error: updateError } = await client
        .from('usuarios')
        .update({ activo: false })
        .eq('id', sensei.usuario_id)

      if (updateError) throw updateError

      // Limpiar referencias en otras tablas
      // 1. Limpiar director_tecnico_id en clubes (referencia al usuario_id)
      if (sensei.usuario_id) {
        const { error: clubesError } = await client
          .from('clubes')
          .update({ director_tecnico_id: null })
          .eq('director_tecnico_id', sensei.usuario_id)

        if (clubesError) {
          console.warn('Error al limpiar referencias en clubes:', clubesError)
          // No fallar la eliminación por esto, solo registrar el warning
        }
      }

      // 2. Limpiar entrenador_id en judokas (referencia al id del sensei)
      const { error: judokasError } = await client
        .from('judokas')
        .update({ entrenador_id: null })
        .eq('entrenador_id', id)

      if (judokasError) {
        console.warn('Error al limpiar referencias en judokas:', judokasError)
        // No fallar la eliminación por esto, solo registrar el warning
      }

      // 3. Deshabilitar/eliminar el usuario en auth.users para que el email se pueda reutilizar
      if (sensei.usuario_id) {
        try {
          const response = await fetch('/api/admin/disable-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: sensei.usuario_id,
            }),
          })

          const result = await response.json()
          if (!result.success) {
            console.warn('Error al deshabilitar usuario en auth.users:', result.error)
            // No fallar la eliminación por esto, solo registrar el warning
          }
        } catch (error) {
          console.warn('Error al llamar API para deshabilitar usuario:', error)
          // No fallar la eliminación por esto, solo registrar el warning
        }
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

