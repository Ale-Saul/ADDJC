/**
 * Modelo para miembros de la asociación
 * Datos en usuarios + tabla asociacion (cargo)
 */

import { User } from './auth'

export interface MiembroAsociacion extends User {
  apellido_paterno?: string
  apellido_materno?: string
  cargo?: string | null
}

export interface MiembroAsociacionCreate {
  email: string
  password: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  cargo?: string | null
  activo?: boolean
}

export interface MiembroAsociacionUpdate {
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  email?: string
  cargo?: string | null
  activo?: boolean
}

