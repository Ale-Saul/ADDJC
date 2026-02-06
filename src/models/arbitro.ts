export interface Arbitro {
  id: string
  usuario_id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string | null
  nivel_arbitraje: string | null
  /** ID de la certificación principal (FK a certificaciones) */
  certificacion_id: string | null
  /** Nombre de la certificación (desde join con certificaciones, solo lectura) */
  certificacion?: string | null
  avatar_url?: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ArbitroCreate {
  usuario_id?: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  email?: string
  password?: string
  fecha_nacimiento?: string | null
  nivel_arbitraje?: string | null
  certificacion_id?: string | null
  avatar_url?: string | null
  activo?: boolean
}

export interface ArbitroUpdate {
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  fecha_nacimiento?: string | null
  nivel_arbitraje?: string | null
  certificacion_id?: string | null
  avatar_url?: string | null
  activo?: boolean
}

