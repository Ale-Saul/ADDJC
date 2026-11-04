import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Revalidar el token seguro del usuario con getUser() en el servidor
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/reset-password')

  const isApiRoute = pathname.startsWith('/api')

  // 1. Si no está autenticado y accede a una ruta protegida (que no sea pública ni API), redirigir a /login
  if (!user && !isPublicRoute && !isApiRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // 2. Si ya está autenticado e intenta entrar a /login, redirigir al inicio
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Control de acceso administrativo (RBAC)
  if (user) {
    const userRole = user.user_metadata?.rol ?? user.user_metadata?.role
    const isAdminUiRoute = pathname.startsWith('/asociacion') || pathname.startsWith('/clubes')

    if (isAdminUiRoute && !['asociacion', 'encargado', 'club', 'admin', 'sensei', 'judoka', 'arbitro'].includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
