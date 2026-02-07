/**
 * Tipos relacionados con autenticación
 */

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  nombres: string
  apellidos: string
  rol?: 'admin' | 'asociacion' | 'sensei' | 'encargado' | 'arbitro' | 'judoka'
  club_id?: string
}

export interface User {
  id: string
  email: string
  nombres: string
  apellidos: string
  rol: 'admin' | 'asociacion' | 'sensei' | 'encargado' | 'arbitro' | 'judoka'
  club_id?: string | null
  club_nombre?: string | null // Nombre del club al que pertenece
  sensei_id?: string | null // ID en la tabla senseis (para senseis y encargados)
  judoka_id?: string | null // ID en la tabla judokas (para judokas)
  avatar_url?: string | null
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  activo: boolean
  created_at?: string
  updated_at?: string
}

// Tipo para roles válidos
export type UserRole = 'admin' | 'asociacion' | 'sensei' | 'encargado' | 'arbitro' | 'judoka'

export interface AuthSession {
  user: User
  access_token: string
  expires_at?: number
}

