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
  foto_perfil: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ArbitroCreate {
  usuario_id?: string // Opcional: si no se proporciona, se creará automáticamente
  nombres: string
  apellidos: string
  email?: string // Opcional: requerido si se crea nuevo usuario
  password?: string // Opcional: requerido si se crea nuevo usuario
  fecha_nacimiento?: string | null
  nivel_arbitraje?: string | null
  certificacion_id?: string | null
  foto_perfil?: string | null
  activo?: boolean
}

export interface ArbitroUpdate {
  nombres?: string
  apellidos?: string
  fecha_nacimiento?: string | null
  nivel_arbitraje?: string | null
  certificacion_id?: string | null
  foto_perfil?: string | null
  activo?: boolean
}

