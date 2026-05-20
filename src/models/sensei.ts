export interface Sensei {
  id: string
  usuario_id: string
  club_id: string | null
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
  grado_dan: string | null
  /** ID de la certificación principal (FK a certificaciones) */
  certificacion_id: string | null
  /** Nombre de la certificación (desde join con certificaciones, solo lectura) */
  certificacion?: string | null
  especialidad: string | null
  avatar_url?: string | null
  activo: boolean
  total_certificaciones?: number
  created_at: string
  updated_at: string
  updated_by?: string | null
  modificado_por_nombre?: string
}

export interface SenseiCreate {
  usuario_id?: string
  club_id?: string | null
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
  grado_dan?: string | null
  certificacion_id?: string | null
  especialidad?: string | null
  avatar_url?: string | null
  activo?: boolean
  isEncargado?: boolean
  updated_by?: string | null
}

export interface SenseiUpdate {
  club_id?: string | null
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  email?: string
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  grado_dan?: string | null
  certificacion_id?: string | null
  especialidad?: string | null
  avatar_url?: string | null
  activo?: boolean
  updated_by?: string | null
}

