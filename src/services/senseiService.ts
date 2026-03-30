import { createClient } from '@/lib/supabase/client'
import { Sensei, SenseiCreate, SenseiUpdate } from '@/models/sensei'
import { ApiResponse } from '@/types/globales'
import { userService } from './userService'

const SENSEI_WITH_USER_COLUMNS = 'id, club_id, usuario_id, grado_dan, especialidad, created_at, updated_at, usuarios:usuario_id(id, nombre, apellido_paterno, apellido_materno, avatar_url, correo, fecha_nacimiento, numero_celular, ci, ci_extension, genero, activo), clubes:club_id(id, nombre_club)'

function mapSenseiRow(row: any, certsCountMap: Record<string, number>): Sensei {
  const u = row.usuarios
  const nombres = u?.nombre ?? ''
  const email = u?.correo ?? ''
  const apellidoP = u?.apellido_paterno ?? ''
  const apellidoM = u?.apellido_materno ?? ''

  const usuarioId = String(row.usuario_id).toLowerCase();
  const total_certificaciones = certsCountMap[usuarioId] || 0

  return {
    ...row,
    nombres,
    apellidos: [apellidoP, apellidoM].filter(Boolean).join(' '),
    apellido_paterno: apellidoP,
    apellido_materno: apellidoM,
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
    clubes: row.clubes || null,
    nombre_club: row.clubes?.nombre_club || null
  }
}

export const senseiService = {
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Sensei[]>> {
    try {
      const client = createClient()
      
      // 1. Obtener senseis
      const { data: senseis, error } = await client
        .from('senseis')
        .select(SENSEI_WITH_USER_COLUMNS)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 2. Obtener conteo de certificaciones
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

      let mapped = (senseis || []).map(row => mapSenseiRow(row, certsCountMap))
      
      if (!includeInactive) {
        mapped = mapped.filter(s => s.activo)
      }
      
      return { success: true, data: mapped }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  async getByClub(clubId: string): Promise<ApiResponse<Sensei[]>> {
    try {
      const client = createClient()
      const { data: senseis, error } = await client
        .from('senseis')
        .select(SENSEI_WITH_USER_COLUMNS)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const { data: certs } = await client.from('certificaciones').select('usuario_id').eq('activo', true)
      const certsCountMap: Record<string, number> = {}
      if (certs) {
        certs.forEach(c => { if (c.usuario_id) certsCountMap[c.usuario_id] = (certsCountMap[c.usuario_id] || 0) + 1 })
      }

      const mapped = (senseis || []).map(row => mapSenseiRow(row, certsCountMap))
      return { success: true, data: mapped }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async getById(id: string): Promise<ApiResponse<Sensei>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('senseis')
        .select(SENSEI_WITH_USER_COLUMNS)
        .eq('id', id)
        .single()

      if (error) throw error

      const { count } = await client.from('certificaciones').select('*', { count: 'exact', head: true }).eq('usuario_id', data.usuario_id).eq('activo', true)
      const mapped = mapSenseiRow(data, { [data.usuario_id]: count || 0 })
      return { success: true, data: mapped }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async create(sensei: SenseiCreate): Promise<ApiResponse<Sensei>> {
    try {
      let userId = sensei.usuario_id
      if (!userId || userId === 'temp-user-id') {
        if (!sensei.email || !sensei.password) return { success: false, error: 'Email y contraseña requeridos' }
        const userResult = sensei.isEncargado
          ? await userService.createEncargadoUser(sensei.nombres, sensei.apellido_paterno, sensei.apellido_materno, sensei.email!, sensei.password!, sensei.club_id || undefined, sensei.fecha_nacimiento, sensei.numero_celular, sensei.genero, sensei.ci, (sensei as any).ci_extension)
          : await userService.createSenseiUser(sensei.nombres, sensei.apellido_paterno, sensei.apellido_materno, sensei.email!, sensei.password!, sensei.fecha_nacimiento, sensei.numero_celular, sensei.genero, sensei.ci, (sensei as any).ci_extension)
        
        if (!userResult.success || !userResult.data) return { success: false, error: userResult.error || 'Error al crear usuario' }
        userId = userResult.data.usuarioId
      }

      const client = createClient()
      const { data: inserted, error } = await client
        .from('senseis')
        .insert({
          usuario_id: userId,
          club_id: sensei.club_id ?? null,
          grado_dan: sensei.grado_dan ?? null,
          especialidad: sensei.especialidad ?? null,
        })
        .select('id')
        .single()

      if (error) throw error

      const userUpdate: Record<string, any> = {}
      if (sensei.avatar_url) userUpdate.avatar_url = sensei.avatar_url
      if (sensei.activo !== undefined) userUpdate.activo = sensei.activo
      if (Object.keys(userUpdate).length > 0) {
        await client.from('usuarios').update(userUpdate).eq('id', userId)
      }

      return await this.getById(inserted.id)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async update(id: string, sensei: SenseiUpdate): Promise<ApiResponse<Sensei>> {
    try {
      const client = createClient()
      const { certificacion, nombres, apellido_paterno, apellido_materno, email, fecha_nacimiento, numero_celular, ci, genero, activo, avatar_url, ...senseiPayload } = sensei as any
      
      const { data: current, error: getError } = await client.from('senseis').select('usuario_id').eq('id', id).single()
      if (getError || !current) throw new Error('Sensei no encontrado')

      // 1. Actualizar tabla 'senseis' solo si hay datos específicos
      const senseiFields = ['club_id', 'grado_dan', 'especialidad']
      const senseiUpdate: Record<string, any> = {}
      senseiFields.forEach(f => {
        if (senseiPayload[f] !== undefined) senseiUpdate[f] = senseiPayload[f]
      })

      if (Object.keys(senseiUpdate).length > 0) {
        const { error } = await client.from('senseis').update(senseiUpdate).eq('id', id)
        if (error) throw error
      }

      // 2. Actualizar tabla 'usuarios'
      const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
      if (nombres !== undefined) userUpdate.nombre = nombres
      if (apellido_paterno !== undefined) userUpdate.apellido_paterno = apellido_paterno
      if (apellido_materno !== undefined) userUpdate.apellido_materno = apellido_materno
      if (email !== undefined) userUpdate.correo = email
      if (fecha_nacimiento !== undefined) userUpdate.fecha_nacimiento = fecha_nacimiento
      if (numero_celular !== undefined) userUpdate.numero_celular = numero_celular
      if (ci !== undefined) userUpdate.ci = ci
      if (sensei.ci_extension !== undefined) userUpdate.ci_extension = sensei.ci_extension
      if (genero !== undefined) userUpdate.genero = genero
      if (activo !== undefined) userUpdate.activo = activo
      if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url
      
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
      const { data: sensei } = await client.from('senseis').select('usuario_id').eq('id', id).single()
      if (!sensei) return { success: false, error: 'Sensei no encontrado' }

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: sensei.usuario_id }),
      })

      const result = await response.json()
      return result.success ? { success: true } : { success: false, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  async restore(id: string): Promise<ApiResponse<Sensei>> {
    try {
      const client = createClient()
      const { data: sensei } = await client.from('senseis').select('usuario_id').eq('id', id).single()
      if (!sensei) throw new Error('Sensei no encontrado')

      const { error } = await client.from('usuarios').update({ activo: true }).eq('id', sensei.usuario_id)
      if (error) throw error
      
      return await this.getById(id)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
}
