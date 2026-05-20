export interface Club {
  id: string
  nombre_club: string
  provincia: string | null
  direccion: string | null
  telefono_contacto: string | null
  director_tecnico_id: string | null
  activo: boolean
  horario_inicio?: string | null
  horario_fin?: string | null
  created_at: string
  updated_at: string
  documentos?: ClubDocumento[]
  director_tecnico?: {
    id: string
    nombres: string
    apellidos: string
    ci: string | null
    ci_extension: string | null
  } | null
}

export interface ClubDocumento {
  id: string
  club_id: string
  nombre_documento: string
  url_documento: string
  tipo_documento: string | null
  created_at: string
}

export interface ClubCreate {
  nombre_club: string
  provincia?: string | null
  direccion?: string | null
  telefono_contacto?: string | null
  director_tecnico_id?: string | null
  horario_inicio?: string | null
  horario_fin?: string | null
  activo?: boolean
}

export interface ClubUpdate {
  nombre_club?: string
  provincia?: string | null
  direccion?: string | null
  telefono_contacto?: string | null
  director_tecnico_id?: string | null
  horario_inicio?: string | null
  horario_fin?: string | null
  activo?: boolean
}

