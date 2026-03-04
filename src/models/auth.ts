/**
 * Tipos relacionados con autenticación
 */

export type { UserRole } from '@/constants/roles'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  nombres: string
  apellidos: string
  rol?: UserRole
  club_id?: string
}

export interface User {
  id: string
  email: string
  nombres: string
  apellidos: string
  rol: UserRole
  club_id?: string | null
  club_nombre?: string | null // Nombre del club al que pertenece
  sensei_id?: string | null // ID en la tabla senseis (para senseis y encargados)
  judoka_id?: string | null // ID en la tabla judokas (para judokas)
  avatar_url?: string | null
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  activo: boolean
  debe_cambiar_password?: boolean // Indica si debe cambiar la contraseña (primer login)
  created_at?: string
  updated_at?: string
}


export interface AuthSession {
  user: User
  access_token: string
  expires_at?: number
}

