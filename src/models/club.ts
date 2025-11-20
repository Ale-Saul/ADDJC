export interface Club {
  id: string
  nombre_club: string
  municipio: string | null
  direccion: string | null
  telefono_contacto: string | null
  director_tecnico_id: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ClubCreate {
  nombre_club: string
  municipio?: string | null
  direccion?: string | null
  telefono_contacto?: string | null
  director_tecnico_id?: string | null
  activo?: boolean
}

export interface ClubUpdate {
  nombre_club?: string
  municipio?: string | null
  direccion?: string | null
  telefono_contacto?: string | null
  director_tecnico_id?: string | null
  activo?: boolean
}

