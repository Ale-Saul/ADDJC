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
  fecha_nacimiento: string
  categoria: string | null
  peso_competitivo: number | null
  cinturon_actual: string | null
  avatar_url?: string | null
  activo: boolean
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
  fecha_nacimiento: string
  categoria?: string | null
  peso_competitivo?: number | null
  cinturon_actual?: string | null
  avatar_url?: string | null
  activo?: boolean
}

export interface JudokaUpdate {
  club_id?: string | null
  entrenador_id?: string | null
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  fecha_nacimiento?: string
  categoria?: string | null
  peso_competitivo?: number | null
  cinturon_actual?: string | null
  avatar_url?: string | null
  activo?: boolean
}

