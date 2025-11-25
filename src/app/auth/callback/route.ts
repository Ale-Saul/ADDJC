import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // El método `setAll` fue llamado desde un Server Component.
            }
          },
        },
      }
    )
    
    // Intentar intercambiar el código
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      // Si falla, redirigimos al cliente con el código para que intente procesarlo él
      // Esto es un fallback por si el servidor no tiene las cookies de verifier necesarias
      return NextResponse.redirect(`${origin}${next}?code=${code}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
