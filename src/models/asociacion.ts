/**
 * Modelo para miembros de la asociación
 * Los miembros de la asociación se almacenan en user_profiles con rol 'asociacion'
 */

import { User } from './auth'

export interface MiembroAsociacion extends User {
  // Hereda todos los campos de User:
  // id, email, nombres, apellidos, rol: 'asociacion', activo, created_at, updated_at
}

export interface MiembroAsociacionCreate {
  email: string
  password: string
  nombres: string
  apellidos: string
  activo?: boolean
}

export interface MiembroAsociacionUpdate {
  nombres?: string
  apellidos?: string
  email?: string
  activo?: boolean
}

