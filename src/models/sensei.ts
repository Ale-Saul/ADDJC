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
  usuario_id?: string // Opcional: si no se proporciona, se creará automáticamente
  club_id?: string | null
  nombres: string
  apellidos: string
  email?: string // Opcional: requerido si se crea nuevo usuario
  password?: string // Opcional: requerido si se crea nuevo usuario
  fecha_nacimiento?: string | null
  grado_dan?: string | null
  certificacion?: string | null
  especialidad?: string | null
  foto_perfil?: string | null
  activo?: boolean
  isEncargado?: boolean // Si es true, se asignará rol 'encargado' en lugar de 'sensei'
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

