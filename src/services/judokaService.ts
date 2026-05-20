import { createClient } from '@/lib/supabase/client'
import { Judoka, JudokaCreate, JudokaUpdate } from '@/models/judoka'
import { ApiResponse } from '@/types/globales'
import { userService, getUsersNamesByIds } from './userService'

const selectJudokasWithUsuario = 'id, usuario_id, club_id, entrenador_id, activo, peso_competitivo, cinturon_actual, categoria, created_at, updated_at, usuarios:usuario_id(id, nombre, apellido_paterno, apellido_materno, avatar_url, correo, fecha_nacimiento, numero_celular, ci, ci_extension, genero, activo, updated_by), senseis:entrenador_id(usuarios:usuario_id(nombre, apellido_paterno, apellido_materno)), clubes:club_id(nombre_club)'

function mapJudokaRow(row: any): Judoka {
  const u = row.usuarios
  const nombres = u?.nombre ?? ''
  const email = u?.correo ?? ''
  const apellidoPaterno = u?.apellido_paterno ?? ''
  const apellidoMaterno = u?.apellido_materno ?? ''
  const apellidos = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ')

  const s = row.senseis?.usuarios
  const nombreEntrenador = s ? [s.nombre, s.apellido_paterno, s.apellido_materno].filter(Boolean).join(' ') : undefined
  const nombreClub = row.clubes?.nombre_club

  return {
    ...row,
    nombres,
    apellidos,
    apellido_paterno: apellidoPaterno,
    apellido_materno: apellidoMaterno,
    email,
    fecha_nacimiento: u?.fecha_nacimiento ?? null,
    numero_celular: u?.numero_celular ?? null,
    ci: u?.ci ?? null,
    ci_extension: u?.ci_extension ?? null,
    genero: u?.genero ?? null,
    activo: u?.activo ?? true,
    avatar_url: u?.avatar_url ?? null,
    nombre_entrenador: nombreEntrenador,
    nombre_club: nombreClub,
    updated_by: u?.updated_by ?? null,
    modificado_por_nombre: undefined
  }
}

async function populateEditors(judokas: Judoka[]): Promise<Judoka[]> {
  if (!judokas.length) return judokas
  const editorIds = Array.from(new Set(judokas.map(j => j.updated_by).filter(Boolean))) as string[]
  if (editorIds.length === 0) return judokas
  
  const editorMap = await getUsersNamesByIds(editorIds)
  return judokas.map(j => ({
    ...j,
    modificado_por_nombre: j.updated_by ? (editorMap[j.updated_by] || 'Sistema / Desconocido') : undefined
  }))
}

export const judokaService = {
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Judoka[]>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .order('created_at', { ascending: false })

      if (error) throw error

      let mapped = (data || []).map(mapJudokaRow)
      mapped = await populateEditors(mapped)

      if (!includeInactive) {
        mapped = mapped.filter(j => j.activo)
      }
      return { success: true, data: mapped }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async getByClub(clubId: string): Promise<ApiResponse<Judoka[]>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error
      const mapped = await populateEditors((data || []).map(mapJudokaRow))
      return { success: true, data: mapped }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async getByEntrenador(entrenadorId: string): Promise<ApiResponse<Judoka[]>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .eq('entrenador_id', entrenadorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      const mapped = await populateEditors((data || []).map(mapJudokaRow))
      return { success: true, data: mapped }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async getById(id: string): Promise<ApiResponse<Judoka>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('judokas')
        .select(selectJudokasWithUsuario)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return { success: true, data: data }
      
      const mapped = await populateEditors([mapJudokaRow(data)])
      return { success: true, data: mapped[0] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async create(judoka: JudokaCreate, updated_by?: string): Promise<ApiResponse<Judoka>> {
    try {
      let userId = judoka.usuario_id
      if (!userId || userId === 'temp-user-id') {
        const userResult = await userService.createJudokaUser(judoka.nombres, judoka.apellido_paterno, judoka.apellido_materno, judoka.email!, judoka.password!, undefined, judoka.fecha_nacimiento, judoka.numero_celular, judoka.genero, judoka.ci, judoka.ci_extension)
        if (!userResult.success || !userResult.data) return { success: false, error: userResult.error || 'Error al crear usuario' }
        userId = userResult.data.usuarioId as string
      }

      const client = createClient()
      const { data: inserted, error } = await client
        .from('judokas')
        .insert({
          usuario_id: userId,
          club_id: judoka.club_id ?? null,
          entrenador_id: judoka.entrenador_id ?? null,
          categoria: judoka.categoria ?? null,
          peso_competitivo: judoka.peso_competitivo ?? null,
          cinturon_actual: judoka.cinturon_actual ?? null,
        })
        .select('id')
        .single()

      if (error) throw error

      const userUpdate: Record<string, unknown> = {}
      if (judoka.avatar_url) userUpdate.avatar_url = judoka.avatar_url
      if (judoka.activo !== undefined) userUpdate.activo = judoka.activo
      if (updated_by) userUpdate.updated_by = updated_by
      if (Object.keys(userUpdate).length > 0) {
        await client.from('usuarios').update(userUpdate).eq('id', userId)
      }

      return await this.getById(inserted.id)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async update(id: string, judoka: JudokaUpdate): Promise<ApiResponse<Judoka>> {
    try {
      const client = createClient()
      const { email, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, numero_celular, ci, genero, activo, avatar_url, updated_by, ...judokaPayload } = judoka as any
      
      const { data: current, error: getError } = await client.from('judokas').select('usuario_id').eq('id', id).single()
      if (getError || !current) throw new Error('Judoka no encontrado')

      const judokaFields = ['club_id', 'entrenador_id', 'categoria', 'peso_competitivo', 'cinturon_actual']
      const judokaUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
      judokaFields.forEach(f => {
        if (judokaPayload[f] !== undefined) judokaUpdate[f] = judokaPayload[f]
      })

      if (Object.keys(judokaUpdate).length > 0) {
        const { error } = await client.from('judokas').update(judokaUpdate).eq('id', id)
        if (error) throw error
      }

      const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
      if (nombres !== undefined) userUpdate.nombre = nombres
      if (apellido_paterno !== undefined) userUpdate.apellido_paterno = apellido_paterno
      if (apellido_materno !== undefined) userUpdate.apellido_materno = apellido_materno
      if (email !== undefined) userUpdate.correo = email
      if (fecha_nacimiento !== undefined) userUpdate.fecha_nacimiento = fecha_nacimiento
      if (numero_celular !== undefined) userUpdate.numero_celular = numero_celular
      if (ci !== undefined) userUpdate.ci = ci
      if (judoka.ci_extension !== undefined) userUpdate.ci_extension = judoka.ci_extension
      if (genero !== undefined) userUpdate.genero = genero
      if (activo !== undefined) userUpdate.activo = activo
      if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
      if (updated_by !== undefined) userUpdate.updated_by = updated_by
      
      if (Object.keys(userUpdate).length > 1) {
        const { error } = await client.from('usuarios').update(userUpdate).eq('id', current.usuario_id)
        if (error) {
          if (error.message?.includes('usuarios_ci_ci_extension_key') || error.code === '23505') {
            return { success: false, error: 'Ya existe un usuario registrado con este Carnet de Identidad y extensión' }
          }
          throw error
        }
      }

      return await this.getById(id)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = createClient()
      const { data } = await client.from('judokas').select('usuario_id').eq('id', id).single()
      if (!data) return { success: false, error: 'Judoka no encontrado' }

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: data.usuario_id }),
      })

      const result = await response.json()
      return result.success ? { success: true } : { success: false, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async restore(id: string): Promise<ApiResponse<Judoka>> {
    try {
      const client = createClient()
      const { data } = await client.from('judokas').select('usuario_id').eq('id', id).single()
      if (!data) throw new Error('Judoka no encontrado')

      const { error } = await client.from('usuarios').update({ activo: true }).eq('id', data.usuario_id)
      if (error) throw error
      return await this.getById(id)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
}
