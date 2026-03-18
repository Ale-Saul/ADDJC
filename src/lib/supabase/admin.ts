/**
 * Cliente Admin de Supabase para operaciones privilegiadas
 * 
 * IMPORTANTE: Este cliente solo debe usarse en Server Actions o API Routes
 * NUNCA exponer la service role key en el cliente
 */
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY no está configurada. Las operaciones admin no funcionarán.')
}

if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL no está configurada. Las operaciones admin no funcionarán.')
}



// Función helper para crear cliente admin dinámicamente (útil si las env vars no están disponibles en tiempo de módulo)
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas')
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

