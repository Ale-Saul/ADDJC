/**
 * Modelo para miembros de la asociación
 * Datos en usuarios + tabla asociacion (cargo)
 */

import { User } from './auth'

export interface MiembroAsociacion extends User {
  apellido_paterno?: string
  apellido_materno?: string
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  fecha_ingreso?: string | null
  cargo?: string | null
}

export interface MiembroAsociacionCreate {
  email: string
  password: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  fecha_ingreso?: string | null
  cargo?: string | null
  activo?: boolean
}

export interface MiembroAsociacionUpdate {
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  fecha_nacimiento?: string | null
  numero_celular?: string | null
  ci?: string | null
  ci_extension?: string | null
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | null
  email?: string
  fecha_ingreso?: string | null
  cargo?: string | null
  activo?: boolean
}

