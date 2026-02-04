/**
 * Cliente de Supabase para uso general (compatibilidad con código existente)
 * 
 * NOTA: Para nuevas implementaciones, usa:
 * - `@/lib/supabase/client` para Client Components
 * - `@/lib/supabase/server` para Server Components
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

// Cliente básico para compatibilidad con código existente
// Este cliente funciona pero no maneja sesiones automáticamente
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

