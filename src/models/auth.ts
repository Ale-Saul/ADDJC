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
  avatar_url?: string | null
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

