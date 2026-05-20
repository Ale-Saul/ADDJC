import { createClient } from '@/lib/supabase/client'
import { Arbitro, ArbitroCreate, ArbitroUpdate } from '@/models/arbitro'
import { ApiResponse } from '@/types/globales'
import { userService, getUsersNamesByIds } from './userService'

const selectArbitrosWithUsuario = 'id, usuario_id, nivel_arbitraje, created_at, updated_at, usuarios:usuario_id(id, nombre, apellido_paterno, apellido_materno, avatar_url, correo, fecha_nacimiento, numero_celular, ci, ci_extension, genero, activo, updated_by)'

function mapArbitroRow(row: any, certsCountMap: Record<string, number>): Arbitro {
  const u = row.usuarios
  const nombres = u?.nombre ?? ''
  const email = u?.correo ?? ''
  const apellidoPaterno = u?.apellido_paterno ?? ''
  const apellidoMaterno = u?.apellido_materno ?? ''
  const apellidos = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ')
  
  const usuarioId = String(row.usuario_id).toLowerCase();
  const total_certificaciones = certsCountMap[usuarioId] || 0

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
    certificacion: null,
    certificacion_id: null,
    total_certificaciones,
    updated_by: u?.updated_by ?? null,
  }
}

async function populateEditors(arbitros: Arbitro[]): Promise<Arbitro[]> {
  if (!arbitros.length) return arbitros
  const editorIds = Array.from(new Set(arbitros.map(a => a.updated_by).filter(Boolean))) as string[]
  if (editorIds.length === 0) return arbitros
  
  const editorMap = await getUsersNamesByIds(editorIds)
  return arbitros.map(a => ({
    ...a,
    modificado_por_nombre: a.updated_by ? (editorMap[a.updated_by] || 'Sistema / Desconocido') : undefined
  }))
}

export const arbitroService = {
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Arbitro[]>> {
    try {
      const client = createClient()
      
      // 1. Obtener árbitros
      const { data: arbitros, error } = await client
        .from('arbitros')
        .select(selectArbitrosWithUsuario)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 2. Obtener conteo de certificaciones en una consulta separada
      const { data: certs, error: certsError } = await client
        .from('certificaciones')
        .select('usuario_id, activo')

      const certsCountMap: Record<string, number> = {}
      if (!certsError && certs) {
        certs.forEach(c => {
          if (c.usuario_id && c.activo) {
            const uid = String(c.usuario_id).toLowerCase();
            certsCountMap[uid] = (certsCountMap[uid] || 0) + 1
          }
        })
      }

      let mapped = (arbitros || []).map(row => mapArbitroRow(row, certsCountMap))
      mapped = await populateEditors(mapped)
      
      if (!includeInactive) {
        return { success: true, data: mapped.filter(a => a.activo) }
      }

      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  async getById(id: string): Promise<ApiResponse<Arbitro>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('arbitros')
        .select(selectArbitrosWithUsuario)
        .eq('id', id)
        .single()

      if (error) throw error

      const { count } = await client
        .from('certificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', data.usuario_id)
        .eq('activo', true)

      const mappedData = mapArbitroRow(data, { [data.usuario_id]: count || 0 })
      const [final] = await populateEditors([mappedData])
      return { success: true, data: final }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  async create(arbitro: ArbitroCreate): Promise<ApiResponse<Arbitro>> {
    try {
      let usuarioId: string | undefined = arbitro.usuario_id && arbitro.usuario_id !== 'temp-user-id' ? arbitro.usuario_id : undefined

      if (!usuarioId) {
        if (!arbitro.email || !arbitro.password) {
          return { success: false, error: 'Email y contraseña son requeridos' }
        }

        const userResult = await userService.createArbitroUser(
          arbitro.nombres,
          arbitro.apellido_paterno,
          arbitro.apellido_materno,
          arbitro.email!,
          arbitro.password!,
          arbitro.fecha_nacimiento ?? null,
          arbitro.numero_celular,
          arbitro.genero,
          arbitro.ci,
          (arbitro as any).ci_extension
        )
        if (!userResult.success || !userResult.data) {
          return { success: false, error: userResult.error || 'Error al crear usuario' }
        }
        usuarioId = userResult.data.usuarioId
      }

      const client = createClient()
      const { data: inserted, error } = await client
        .from('arbitros')
        .insert({
          usuario_id: usuarioId,
          nivel_arbitraje: arbitro.nivel_arbitraje ?? null,
        })
        .select('id')
        .single()

      if (error) throw error

      const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
      if (arbitro.avatar_url) userUpdate.avatar_url = arbitro.avatar_url
      if (arbitro.activo !== undefined) userUpdate.activo = arbitro.activo
      if (arbitro.updated_by) userUpdate.updated_by = arbitro.updated_by

      if (Object.keys(userUpdate).length > 1) {
        await client.from('usuarios').update(userUpdate).eq('id', usuarioId)
      }

      return await this.getById(inserted.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  async update(id: string, arbitro: ArbitroUpdate): Promise<ApiResponse<Arbitro>> {
    try {
      const client = createClient()
      const { certificacion, nombres, apellido_paterno, apellido_materno, email, fecha_nacimiento, numero_celular, ci, genero, activo, avatar_url, ...updatePayload } = arbitro as any
      
      const { data: current, error: getError } = await client.from('arbitros').select('usuario_id').eq('id', id).single()
      if (getError || !current) throw new Error('Árbitro no encontrado')

      const arbitroFields = ['nivel_arbitraje']
      const arbitroUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
      arbitroFields.forEach(f => {
        if (updatePayload[f] !== undefined) arbitroUpdate[f] = updatePayload[f]
      })

      if (Object.keys(arbitroUpdate).length > 0) {
        const { error } = await client.from('arbitros').update(arbitroUpdate).eq('id', id)
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
      if (arbitro.ci_extension !== undefined) userUpdate.ci_extension = arbitro.ci_extension
      if (genero !== undefined) userUpdate.genero = genero
      if (activo !== undefined) userUpdate.activo = activo
      if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
      if (arbitro.updated_by !== undefined) userUpdate.updated_by = arbitro.updated_by
      
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
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = createClient()
      const { data: arbitro } = await client.from('arbitros').select('usuario_id').eq('id', id).single()
      if (!arbitro) return { success: false, error: 'Árbitro no encontrado' }

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: arbitro.usuario_id }),
      })

      const result = await response.json()
      return result.success ? { success: true } : { success: false, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async restore(id: string): Promise<ApiResponse<Arbitro>> {
    try {
      const client = createClient()
      const { data: arbitro } = await client.from('arbitros').select('usuario_id').eq('id', id).single()
      if (!arbitro) throw new Error('Árbitro no encontrado')

      const { error } = await client.from('usuarios').update({ activo: true }).eq('id', arbitro.usuario_id)
      if (error) throw error

      return await this.getById(id)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
}
