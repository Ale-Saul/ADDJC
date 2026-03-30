import { createClient } from '@/lib/supabase/client'
import { Club, ClubCreate, ClubUpdate, ClubDocumento } from '@/models/club'
import { ApiResponse } from '@/types/globales'

const CLUB_WITH_DIRECTOR_COLUMNS = `
  id, 
  nombre_club, 
  provincia, 
  direccion, 
  telefono_contacto, 
  director_tecnico_id, 
  activo, 
  created_at, 
  updated_at,
  documentos:club_documentos(*),
  director_tecnico:director_tecnico_id(
    id,
    usuario_id,
    usuarios:usuario_id(
      id,
      nombre,
      apellido_paterno,
      apellido_materno,
      ci,
      ci_extension
    )
  )
`

export const clubService = {
  /**
   * Obtener todos los clubes
   */
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<Club[]>> {
    try {
      const client = createClient()
      let query = client
        .from('clubes')
        .select(CLUB_WITH_DIRECTOR_COLUMNS)
        .order('created_at', { ascending: false })

      if (!includeInactive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error

      const mappedData = (data || []).map(club => {
        const dt = club.director_tecnico
        const u = dt?.usuarios
        return {
          ...club,
          director_tecnico: dt ? {
            id: dt.id,
            nombres: u?.nombre || '',
            apellidos: [u?.apellido_paterno, u?.apellido_materno].filter(Boolean).join(' '),
            ci: u?.ci,
            ci_extension: u?.ci_extension
          } : null
        }
      })

      return { success: true, data: mappedData }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, error: errorMessage }
    }
  },

  /**
   * Obtener un club por ID
   */
  async getById(id: string): Promise<ApiResponse<Club>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('clubes')
        .select(CLUB_WITH_DIRECTOR_COLUMNS)
        .eq('id', id)
        .single()

      if (error) throw error

      const dt = data.director_tecnico
      const u = dt?.usuarios
      const mapped = {
        ...data,
        director_tecnico: dt ? {
          id: dt.id,
          nombres: u?.nombre || '',
          apellidos: [u?.apellido_paterno, u?.apellido_materno].filter(Boolean).join(' '),
          ci: u?.ci,
          ci_extension: u?.ci_extension
        } : null
      }

      return { success: true, data: mapped }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  /**
   * Crear un nuevo club
   */
  async create(club: ClubCreate): Promise<ApiResponse<Club>> {
    try {
      const client = createClient()
      
      // 1. Limpiar el objeto club de campos que no pertenecen a la tabla 'clubes'
      // (como los campos 'new_' del formulario)
      const { 
        new_nombres, 
        new_apellido_paterno, 
        new_apellido_materno, 
        new_email, 
        new_ci, 
        new_ci_extension,
        ...validClubData 
      } = club as any;

      // 2. Crear el club
      const { data, error } = await client
        .from('clubes')
        .insert(validClubData)
        .select()
        .single()

      if (error) throw error

      // Si se asignó un director técnico, actualizar su rol a 'encargado' y club_id
      if (club.director_tecnico_id && data) {
        // Obtener el usuario_id del sensei
        const { data: senseiData } = await client
          .from('senseis')
          .select('usuario_id')
          .eq('id', club.director_tecnico_id)
          .single()

        if (senseiData?.usuario_id) {
          // Actualizar usuarios (rol)
          await client
            .from('usuarios')
            .update({ 
              rol: 'encargado'
            })
            .eq('id', senseiData.usuario_id)
          
          // Actualizar también la tabla senseis para mantener sincronización y asignar club
          await client
            .from('senseis')
            .update({ 
              club_id: data.id
            })
            .eq('id', club.director_tecnico_id)
        }
      }

      return await this.getById(data.id)
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  /**
   * Actualizar un club
   */
  async update(id: string, club: ClubUpdate): Promise<ApiResponse<Club>> {
    try {
      const client = createClient()
      
      // 1. Limpiar el objeto club de campos que no pertenecen a la tabla 'clubes'
      const { 
        new_nombres, 
        new_apellido_paterno, 
        new_apellido_materno, 
        new_email, 
        new_ci, 
        new_ci_extension,
        director_tecnico, // Campo que viene del join y no debe enviarse en el update
        ...validClubData 
      } = club as any;

      // 2. Si se está actualizando el director técnico, manejar cambios de rol
      if (validClubData.director_tecnico_id !== undefined) {
        // Obtener el director técnico anterior
        const { data: clubAnterior } = await client
          .from('clubes')
          .select('director_tecnico_id')
          .eq('id', id)
          .single()

        const directorAnterior = clubAnterior?.director_tecnico_id
        const directorNuevo = club.director_tecnico_id

        // Si cambió el director técnico
        if (directorAnterior !== directorNuevo) {
          // Si había un director anterior, cambiar su rol a 'sensei'
          if (directorAnterior) {
            // Obtener el usuario_id del sensei anterior
            const { data: senseiAnteriorData } = await client
              .from('senseis')
              .select('usuario_id')
              .eq('id', directorAnterior)
              .single()

            if (senseiAnteriorData?.usuario_id) {
              await client
                .from('usuarios')
                .update({ 
                  rol: 'sensei'
                })
                .eq('id', senseiAnteriorData.usuario_id)
            }
          }

          // Si hay un nuevo director, cambiar su rol a 'encargado' y actualizar club_id
          if (directorNuevo) {
            // Obtener el usuario_id del sensei nuevo
            const { data: senseiNuevoData } = await client
              .from('senseis')
              .select('usuario_id')
              .eq('id', directorNuevo)
              .single()

            if (senseiNuevoData?.usuario_id) {
              // Actualizar usuarios
              await client
                .from('usuarios')
                .update({ 
                  rol: 'encargado'
                })
                .eq('id', senseiNuevoData.usuario_id)
              
              // Actualizar también la tabla senseis para mantener sincronización
              await client
                .from('senseis')
                .update({ 
                  club_id: id
                })
                .eq('id', directorNuevo)
            }
          }
        }
      }

      // Actualizar el club
      const { data, error } = await client
        .from('clubes')
        .update(validClubData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return await this.getById(id)
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  /**
   * Eliminar un club de forma real (hard delete)
   * Esto pondrá en NULL el club_id de los senseis y judokas asociados (por ON DELETE SET NULL)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const client = createClient()
      
      const { error } = await client
        .from('clubes')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  /**
   * Restaurar un club (marcar como activo)
   */
  async restore(id: string): Promise<ApiResponse<Club>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('clubes')
        .update({ activo: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  /**
   * Agregar un documento a un club
   */
  async addDocument(clubId: string, nombre: string, url: string, tipo: string, userId: string): Promise<ApiResponse<ClubDocumento>> {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('club_documentos')
        .insert({
          club_id: clubId,
          nombre_documento: nombre,
          url_documento: url,
          tipo_documento: tipo,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  },

  /**
   * Eliminar un documento de un club
   */
  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    try {
      const client = createClient()
      const { error } = await client
        .from('club_documentos')
        .delete()
        .eq('id', documentId)

      if (error) throw error
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
}





