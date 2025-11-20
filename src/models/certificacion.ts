export interface Certificacion {
  id: string
  usuario_id: string // Referencia a user_profiles.id
  tipo_afiliado: 'sensei' | 'arbitro' // Tipo de afiliado al que pertenece
  nombre_certificacion: string
  descripcion: string | null
  fecha_emision: string | null
  fecha_vencimiento: string | null
  archivo_url: string | null // URL del archivo (PDF o imagen) en Supabase Storage
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CertificacionCreate {
  usuario_id: string
  tipo_afiliado: 'sensei' | 'arbitro'
  nombre_certificacion: string
  descripcion?: string | null
  fecha_emision?: string | null
  fecha_vencimiento?: string | null
  archivo_url?: string | null
  activo?: boolean
}

export interface CertificacionUpdate {
  nombre_certificacion?: string
  descripcion?: string | null
  fecha_emision?: string | null
  fecha_vencimiento?: string | null
  archivo_url?: string | null
  activo?: boolean
}

