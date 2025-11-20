export interface Arbitro {
  id: string
  usuario_id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string | null
  nivel_arbitraje: string | null
  certificacion: string | null
  foto_perfil: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ArbitroCreate {
  usuario_id: string
  nombres: string
  apellidos: string
  fecha_nacimiento?: string | null
  nivel_arbitraje?: string | null
  certificacion?: string | null
  foto_perfil?: string | null
  activo?: boolean
}

export interface ArbitroUpdate {
  nombres?: string
  apellidos?: string
  fecha_nacimiento?: string | null
  nivel_arbitraje?: string | null
  certificacion?: string | null
  foto_perfil?: string | null
  activo?: boolean
}

