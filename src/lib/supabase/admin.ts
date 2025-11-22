/**
 * Cliente Admin de Supabase para operaciones privilegiadas
 * 
 * IMPORTANTE: Este cliente solo debe usarse en Server Actions o API Routes
 * NUNCA exponer la service role key en el cliente
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY no está configurada. Las operaciones admin no funcionarán.')
}

// Cliente admin con permisos completos (bypass RLS)
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

