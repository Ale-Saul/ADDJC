export interface Sensei {
  id: string
  usuario_id: string
  club_id: string | null
  nombres: string
  apellidos: string
  fecha_nacimiento: string | null
  grado_dan: string | null
  certificacion: string | null
  especialidad: string | null
  foto_perfil: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface SenseiCreate {
  usuario_id: string
  club_id?: string | null
  nombres: string
  apellidos: string
  fecha_nacimiento?: string | null
  grado_dan?: string | null
  certificacion?: string | null
  especialidad?: string | null
  foto_perfil?: string | null
  activo?: boolean
}

export interface SenseiUpdate {
  club_id?: string | null
  nombres?: string
  apellidos?: string
  fecha_nacimiento?: string | null
  grado_dan?: string | null
  certificacion?: string | null
  especialidad?: string | null
  foto_perfil?: string | null
  activo?: boolean
}

