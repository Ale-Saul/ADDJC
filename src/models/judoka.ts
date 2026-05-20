export interface Judoka {
  id: string
  usuario_id: string
  club_id: string | null
  entrenador_id: string | null
  nombres: string
  /** Apellidos completos para mostrar (apellido_paterno + apellido_materno) */
  apellidos: string
  apellido_paterno?: string
  apellido_materno?: string
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  avatar_url?: string | null
  email?: string | null
  activo: boolean
  peso_competitivo: number | null
  cinturon_actual: string | null
  categoria?: string | null
  nombre_entrenador?: string
  nombre_club?: string
  updated_by?: string | null
  modificado_por_nombre?: string
  created_at: string
  updated_at: string
}

export interface JudokaCreate {
  usuario_id?: string
  club_id?: string | null
  entrenador_id?: string | null
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
  categoria?: string | null
  peso_competitivo?: number | null
  cinturon_actual?: string | null
  avatar_url?: string | null
  activo?: boolean
  updated_by?: string | null
}

export interface JudokaUpdate {
  club_id?: string | null
  entrenador_id?: string | null
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  categoria?: string | null
  peso_competitivo?: number | null
  cinturon_actual?: string | null
  avatar_url?: string | null
  activo?: boolean
  updated_by?: string | null
}

