import { createClient } from '@/lib/supabase/client'
import { MiembroAsociacion, MiembroAsociacionCreate, MiembroAsociacionUpdate } from '@/models/asociacion'
import { ApiResponse } from '@/types/globales'
import { userService, getUsersNamesByIds } from './userService'

// Función helper para crear usuarios usando Admin API
// Removed local helper in favor of userService


export const asociacionService = {
  /**
   * Obtener todos los miembros de la asociación (desde tabla usuarios)
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<MiembroAsociacion[]>> {
    try {
      const client = createClient()
      let query = client
        .from('usuarios')
        .select('id, correo, nombre, apellido_paterno, apellido_materno, rol, avatar_url, fecha_nacimiento, numero_celular, ci, ci_extension, genero, activo, debe_cambiar_password, created_at, updated_at, updated_by, asociacion(cargo, fecha_ingreso)')
        .eq('rol', 'asociacion')
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error

      type UsuarioRow = { id: string; correo?: string; nombre?: string; apellido_paterno?: string; apellido_materno?: string; fecha_nacimiento?: string; numero_celular?: string; ci?: string; ci_extension?: string; genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir'; club_id?: string | null; activo?: boolean; created_at: string; updated_at: string; updated_by?: string | null; asociacion?: { cargo?: string, fecha_ingreso?: string }[] | { cargo?: string, fecha_ingreso?: string } }
      let miembros: MiembroAsociacion[] = (data || []).map((u: UsuarioRow) => {
        const asoc = Array.isArray(u.asociacion) ? u.asociacion[0] : u.asociacion
        const cargo = asoc?.cargo
        const fechaIngreso = asoc?.fecha_ingreso

        return {
          id: u.id,
          email: u.correo || '',
          nombres: u.nombre || '',
          apellidos: [u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ') || '',
          apellido_paterno: u.apellido_paterno || '',
          apellido_materno: u.apellido_materno || '',
          fecha_nacimiento: u.fecha_nacimiento || null,
          numero_celular: u.numero_celular || null,
          ci: u.ci || null,
          ci_extension: u.ci_extension || null,
          genero: u.genero || null,
          rol: 'asociacion' as const,
          club_id: u.club_id || null,
          activo: u.activo ?? true,
          created_at: u.created_at,
          updated_at: u.updated_at,
          updated_by: u.updated_by || null,
          modificado_por_nombre: undefined,
          fecha_ingreso: fechaIngreso || null,
          cargo: cargo || null,
        }
      })

      // Obtener nombres de los editores
      const editorIds = Array.from(new Set(miembros.map(m => m.updated_by).filter(Boolean))) as string[]
      if (editorIds.length > 0) {
        const editorMap = await getUsersNamesByIds(editorIds)
        miembros = miembros.map(m => ({
          ...m,
          modificado_por_nombre: m.updated_by ? (editorMap[m.updated_by] || 'Sistema') : undefined
        }))
      }

      return { success: true, data: miembros }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un miembro por ID (desde tabla usuarios)
   */
  async getById(id: string): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('usuarios')
        .select(`
          id, correo, nombre, apellido_paterno, apellido_materno, rol, avatar_url, 
          fecha_nacimiento, numero_celular, ci, ci_extension, genero, activo, 
          debe_cambiar_password, created_at, updated_at, updated_by,
          asociacion(cargo, fecha_ingreso)
        `)
        .eq('id', id)
        .eq('rol', 'asociacion')
        .single()

      if (error) throw error

      const asoc = Array.isArray(data.asociacion) ? data.asociacion[0] : data.asociacion
      const cargo = asoc?.cargo
      const fechaIngreso = asoc?.fecha_ingreso

      const miembro: MiembroAsociacion = {
        id: data.id,
        email: data.correo || '',
        nombres: data.nombre || '',
        apellidos: [data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' ') || '',
        apellido_paterno: data.apellido_paterno || '',
        apellido_materno: data.apellido_materno || '',
        fecha_nacimiento: data.fecha_nacimiento || null,
        numero_celular: data.numero_celular || null,
        ci: data.ci || null,
        ci_extension: data.ci_extension || null,
        genero: data.genero || null,
        rol: 'asociacion' as const,
        club_id: null,
        activo: data.activo ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
        updated_by: data.updated_by || null,
        modificado_por_nombre: undefined,
        cargo: cargo ?? null,
        fecha_ingreso: fechaIngreso ?? null,
      }

      if (miembro.updated_by) {
        const editorMap = await getUsersNamesByIds([miembro.updated_by])
        miembro.modificado_por_nombre = editorMap[miembro.updated_by] || 'Sistema'
      }

      return { success: true, data: miembro }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Crear un nuevo miembro de la asociación
   */
  async create(miembro: MiembroAsociacionCreate): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const userResult = await userService.createAsociacionUser(
        miembro.nombres,
        miembro.apellido_paterno,
        miembro.apellido_materno,
        miembro.email,
        miembro.password!,
        miembro.fecha_nacimiento,
        miembro.numero_celular,
        miembro.genero,
        miembro.ci,
        miembro.ci_extension
      )

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: userResult.error || 'Error al crear el usuario'
        }
      }

      const usuarioId = userResult.data.usuarioId as string

      // Insertar en tabla asociacion con cargo
      const client = createClient()
      const { error: insertAsocError } = await client
        .from('asociacion')
        .insert({ 
          usuario_id: usuarioId, 
          cargo: miembro.cargo || null,
          fecha_ingreso: miembro.fecha_ingreso || null
        })
      if (insertAsocError) {
        console.warn('Error al crear fila en asociacion:', insertAsocError)
      }

      return await this.getById(usuarioId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Actualizar un miembro de la asociación
   */
  async update(id: string, miembro: MiembroAsociacionUpdate): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const client = createClient()
      const updateData: { 
        nombre?: string; 
        apellido_paterno?: string; 
        apellido_materno?: string; 
        correo?: string; 
        activo?: boolean; 
        fecha_nacimiento?: string | null; 
        numero_celular?: string | null; 
        ci?: string | null; 
        ci_extension?: string | null; 
        genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null;
        updated_at?: string;
        updated_by?: string | null;
      } = {
        updated_at: new Date().toISOString()
      }
      if (miembro.nombres !== undefined) updateData.nombre = miembro.nombres
      if (miembro.apellido_paterno !== undefined) updateData.apellido_paterno = miembro.apellido_paterno
      if (miembro.apellido_materno !== undefined) updateData.apellido_materno = miembro.apellido_materno
      if (miembro.email !== undefined) updateData.correo = miembro.email
      if (miembro.activo !== undefined) updateData.activo = miembro.activo
      if (miembro.fecha_nacimiento !== undefined) updateData.fecha_nacimiento = miembro.fecha_nacimiento
      if (miembro.numero_celular !== undefined) updateData.numero_celular = miembro.numero_celular
      if (miembro.ci !== undefined) updateData.ci = miembro.ci
      if (miembro.ci_extension !== undefined) updateData.ci_extension = miembro.ci_extension
      if (miembro.genero !== undefined) updateData.genero = miembro.genero
      if (miembro.updated_by !== undefined) updateData.updated_by = miembro.updated_by

      if (Object.keys(updateData).length > 0) {
        const { error } = await client
          .from('usuarios')
          .update(updateData)
          .eq('id', id)
          .eq('rol', 'asociacion')
        if (error) {
          if (error.message?.includes('usuarios_ci_ci_extension_key') || error.code === '23505') {
            return { success: false, error: 'Ya existe un usuario registrado con este Carnet de Identidad y extensión' }
          }
          throw error
        }
      }

      if (miembro.cargo !== undefined || miembro.fecha_ingreso !== undefined) {
        const { data: asoc } = await client.from('asociacion').select('id').eq('usuario_id', id).single()
        const asocUpdate: Record<string, unknown> = {}
        if (miembro.cargo !== undefined) asocUpdate.cargo = miembro.cargo
        if (miembro.fecha_ingreso !== undefined) asocUpdate.fecha_ingreso = miembro.fecha_ingreso
        
        if (asoc) {
          if (Object.keys(asocUpdate).length > 0) {
             await client.from('asociacion').update(asocUpdate).eq('usuario_id', id)
          }
        } else {
          await client.from('asociacion').insert({ usuario_id: id, ...asocUpdate })
        }
      }

      return await this.getById(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Eliminar un miembro de la asociación de forma real (hard delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      // Llamar a la API para eliminar el usuario completo
      // El id recibido aquí ya es el usuario_id (porque la tabla asociacion usa usuario_id como PK o referencia directa)
      // Pero espera, getById usa 'usuarios' table id.
      // Confirmemos: getById hace .from('usuarios').eq('id', id).
      // Entonces 'id' es el usuario_id.
      
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: id }),
      })

      const result = await response.json()
      if (!result.success) {
        return { success: false, error: result.error || 'Error al eliminar el miembro' }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Restaurar un miembro de la asociación (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<MiembroAsociacion>> {
    try {
      const client = createClient()
      const { error } = await client
        .from('usuarios')
        .update({ activo: true })
        .eq('id', id)
        .eq('rol', 'asociacion')

      if (error) throw error

      return await this.getById(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  }
}




