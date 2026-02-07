import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { ApiResponse } from '@/types'
import { userService } from './userService'

// Helper para obtener el cliente correcto (navegador si está disponible, básico si no)
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabase
}

const selectArbitrosWithUsuario = '*, certificacion:certificaciones(nombre_certificacion), usuarios:usuario_id(nombre, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, ci, genero, activo, avatar_url)'

function mapArbitroRow(row: any): Arbitro {
  const u = row.usuarios ?? row.usuario_id
  const isUserObject = u && typeof u === 'object' && !Array.isArray(u) && ('nombre' in u || 'apellido_paterno' in u)
  const nombres = isUserObject ? (u?.nombre ?? '') : ''
  const apellidoPaterno = isUserObject ? (u?.apellido_paterno ?? '') : ''
  const apellidoMaterno = isUserObject ? (u?.apellido_materno ?? '') : ''
  const apellidos = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ')
  return {
    ...row,
    nombres,
    apellidos,
    fecha_nacimiento: isUserObject ? (u?.fecha_nacimiento ?? null) : null,
    numero_celular: isUserObject ? (u?.numero_celular ?? null) : null,
    ci: isUserObject ? (u?.ci ?? null) : null,
    genero: isUserObject ? (u?.genero ?? null) : null,
    activo: isUserObject ? (u?.activo ?? true) : true,
    avatar_url: isUserObject ? (u?.avatar_url ?? null) : null,
    usuarios: undefined,
    certificacion: row.certificacion?.nombre_certificacion ?? row.certificacion ?? null,
    certificacion_id: row.certificacion_id ?? null,
  }
}

export const arbitroService = {
  /**
   * Obtener todos los árbitros (nombres, apellidos y fecha_nacimiento desde usuarios)
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Arbitro[]>> {
    try {
      const client = getSupabaseClient()
      let query = client
        .from('arbitros')
        .select(selectArbitrosWithUsuario)
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        // Filtramos en memoria por ahora para evitar problemas con joins
        const { data: activeData, error: activeError } = await query
        if (activeError) throw activeError
        
        const mapped = (activeData || [])
          .map(mapArbitroRow)
          .filter(a => a.activo)
          
        return { success: true, data: mapped }
      }

      const { data, error } = await query

      if (error) throw error

      const mapped = (data || []).map(mapArbitroRow)
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un árbitro por ID (nombres, apellidos y fecha_nacimiento desde usuarios)
   */
  async getById(id: string): Promise<ApiResponse<Arbitro>> {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('arbitros')
        .select(selectArbitrosWithUsuario)
        .eq('id', id)
        .single()

      if (error) throw error

      const mapped = data ? mapArbitroRow(data) : data
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear un nuevo árbitro
   */
  async create(arbitro: ArbitroCreate): Promise<ApiResponse<Arbitro>> {
    try {
      // usuario_id en arbitros es FK a usuarios.id (no a auth.users.id)
      let usuarioId: string | undefined = arbitro.usuario_id && arbitro.usuario_id !== 'temp-user-id' ? arbitro.usuario_id : undefined

      if (!usuarioId) {
        if (!arbitro.email || !arbitro.password) {
          return {
            success: false,
            error: 'Email y contraseña son requeridos para crear un nuevo árbitro'
          }
        }

        const userResult = await userService.createArbitroUser(
          arbitro.nombres,
          arbitro.apellido_paterno,
          arbitro.apellido_materno,
          arbitro.email!,
          arbitro.password!,
          arbitro.fecha_nacimiento ?? null,
          arbitro.numero_celular,
          arbitro.genero
        )
        if (!userResult.success || !userResult.data) {
          return { success: false, error: userResult.error || 'Error al crear el usuario del árbitro' }
        }
        usuarioId = userResult.data.usuarioId
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!usuarioId || !uuidRegex.test(usuarioId)) {
        return { success: false, error: 'El usuario_id debe ser un UUID válido (referencia a tabla usuarios).' }
      }

      const client = getSupabaseClient()
      const insertPayload = {
        usuario_id: usuarioId,
        nivel_arbitraje: arbitro.nivel_arbitraje ?? null,
        certificacion_id: arbitro.certificacion_id ?? null,
      }

      const { data: inserted, error } = await client
        .from('arbitros')
        .insert(insertPayload)
        .select('id')
        .single()

      // Si se proporcionó avatar_url, activo, numero_celular, genero, actualizar el usuario
      if (usuarioId && (arbitro.avatar_url || arbitro.activo !== undefined || arbitro.numero_celular !== undefined || arbitro.ci !== undefined || arbitro.genero !== undefined)) {
        const userUpdate: Record<string, unknown> = {}
        if (arbitro.avatar_url) userUpdate.avatar_url = arbitro.avatar_url
        if (arbitro.activo !== undefined) userUpdate.activo = arbitro.activo
        if (arbitro.numero_celular !== undefined) userUpdate.numero_celular = arbitro.numero_celular
        if (arbitro.ci !== undefined) userUpdate.ci = arbitro.ci
        if (arbitro.genero !== undefined) userUpdate.genero = arbitro.genero
        
        if (Object.keys(userUpdate).length > 0) {
          await client.from('usuarios').update(userUpdate).eq('id', usuarioId)
        }
      }

      if (error) {
        let errorMessage = error.message
        if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
          errorMessage = 'Error: El usuario no existe en la tabla usuarios. Verifica que el usuario se haya creado correctamente.'
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Ya existe un árbitro con este usuario.'
        } else if (error.message.includes('null value') || error.message.includes('not null')) {
          errorMessage = 'Faltan campos requeridos.'
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Los datos no cumplen las validaciones de la base de datos.'
        }
        return { success: false, error: errorMessage }
      }

      if (!inserted?.id) {
        return { success: false, error: 'Error al crear el árbitro' }
      }
      const { data: fullRow, error: fetchError } = await client
        .from('arbitros')
        .select(selectArbitrosWithUsuario)
        .eq('id', inserted.id)
        .single()
      if (fetchError || !fullRow) {
        return { success: true, data: { ...inserted, nombres: '', apellidos: '', fecha_nacimiento: null } as Arbitro }
      }
      return { success: true, data: mapArbitroRow(fullRow) }
    } catch (error) {
      console.error('Error al crear árbitro:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el árbitro'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un árbitro
   */
  async update(id: string, arbitro: ArbitroUpdate): Promise<ApiResponse<Arbitro>> {
    try {
      const client = getSupabaseClient()
      const { certificacion, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, ci, genero, activo, avatar_url, ...updatePayload } = arbitro as ArbitroUpdate & { certificacion?: string | null, numero_celular?: string, ci?: string, genero?: any }
      const { data, error } = await client
        .from('arbitros')
        .update(updatePayload)
        .eq('id', id)
        .select('usuario_id')
        .single()

      if (error) throw error

      if (data?.usuario_id && (nombres !== undefined || apellido_paterno !== undefined || apellido_materno !== undefined || fecha_nacimiento !== undefined || activo !== undefined || avatar_url !== undefined || numero_celular !== undefined || ci !== undefined || genero !== undefined)) {
        const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
        if (nombres !== undefined) userUpdate.nombre = nombres
        if (apellido_paterno !== undefined) userUpdate.apellido_paterno = apellido_paterno
        if (apellido_materno !== undefined) userUpdate.apellido_materno = apellido_materno
        if (fecha_nacimiento !== undefined) userUpdate.fecha_nacimiento = fecha_nacimiento
        if (numero_celular !== undefined) userUpdate.numero_celular = numero_celular
        if (ci !== undefined) userUpdate.ci = ci
        if (genero !== undefined) userUpdate.genero = genero
        if (activo !== undefined) userUpdate.activo = activo
        if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
        await client.from('usuarios').update(userUpdate).eq('id', data.usuario_id)
      }

      const getResult = await client
        .from('arbitros')
        .select(selectArbitrosWithUsuario)
        .eq('id', id)
        .single()
      if (getResult.error || !getResult.data) {
        return { success: false, error: getResult.error?.message ?? 'Error al obtener el árbitro actualizado' }
      }
      return { success: true, data: mapArbitroRow(getResult.data) }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un árbitro de forma real: borra la fila en arbitros, el usuario en auth.users
   * y la fila en usuarios. Así desaparecen de la BD y el email puede reutilizarse.
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch('/api/admin/delete-arbitro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arbitroId: id }),
      })
      const result = await response.json()
      if (!result.success) {
        return { success: false, error: result.error || 'Error al eliminar el árbitro' }
      }
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Restaurar un árbitro (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Arbitro>> {
    try {
      const client = getSupabaseClient()
      
      // Get user_id first
      const { data: arbitroData, error: getError } = await client
        .from('arbitros')
        .select('usuario_id')
        .eq('id', id)
        .single()
        
      if (getError || !arbitroData) throw getError || new Error('Arbitro not found')

      const { error } = await client
        .from('usuarios')
        .update({ activo: true })
        .eq('id', arbitroData.usuario_id)

      if (error) throw error

      return await this.getById(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}

