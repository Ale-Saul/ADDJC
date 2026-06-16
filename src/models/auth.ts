/**
 * Tipos relacionados con autenticación
 */

import type { UserRole } from '@/constants/roles'
export type { UserRole }

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
  /** String combinado para display rápido (Paterno + Materno) */
  apellidos: string  
  apellido_paterno?: string
  apellido_materno?: string
  rol: UserRole
  club_id?: string | null
  club_nombre?: string | null 
  sensei_id?: string | null 
  judoka_id?: string | null 
  /** ID del club que administra operativamente (multi-cargo: admin/asociacion actuando como sensei/encargado) */
  club_id_operativo?: string | null
  /** Nombre del club operativo, para display en sidebar */
  club_nombre_operativo?: string | null
  avatar_url?: string | null
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  activo: boolean
  debe_cambiar_password?: boolean 
  updated_by?: string | null
  modificado_por_nombre?: string
  created_at?: string
  updated_at?: string
}


export interface AuthSession {
  user: User
  access_token: string
  expires_at?: number
}

