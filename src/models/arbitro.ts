export interface Arbitro {
  id: string
  usuario_id: string
  nombres: string
  apellidos: string
  apellido_paterno?: string
  apellido_materno?: string
  email?: string
  fecha_nacimiento: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  nivel_arbitraje: string | null
  /** ID de la certificación principal (FK a certificaciones) */
  certificacion_id: string | null
  /** Nombre de la certificación (desde join con certificaciones, solo lectura) */
  certificacion?: string | null
  avatar_url?: string | null
  activo: boolean
  total_certificaciones?: number
  updated_by?: string | null
  modificado_por_nombre?: string
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
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  nivel_arbitraje?: string | null
  certificacion_id?: string | null
  avatar_url?: string | null
  activo?: boolean
  updated_by?: string | null
}

export interface ArbitroUpdate {
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  email?: string
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  nivel_arbitraje?: string | null
  certificacion_id?: string | null
  avatar_url?: string | null
  activo?: boolean
  updated_by?: string | null
}

