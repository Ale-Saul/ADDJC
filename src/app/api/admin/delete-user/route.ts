import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Elimina un usuario de forma real (Hard Delete):
 * 1. Obtiene el auth_user_id de la tabla usuarios.
 * 2. Elimina el usuario de auth.users (lo que dispara CASCADE en usuarios -> roles).
 * 3. Si no tiene auth_user_id (caso raro), elimina directamente de usuarios.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId } = body

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'usuarioId es requerido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Obtener auth_user_id
    const { data: usuario, error: getError } = await supabaseAdmin
      .from('usuarios')
      .select('auth_user_id')
      .eq('id', usuarioId)
      .single()

    if (getError || !usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // 2. Eliminar de auth.users (Cascade borrará de public.usuarios y tablas hijas)
    if (usuario.auth_user_id) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        usuario.auth_user_id
      )

      if (deleteAuthError) {
        console.error('Error al eliminar usuario de Auth:', deleteAuthError)
        return NextResponse.json(
          { success: false, error: `Error al eliminar usuario de Auth: ${deleteAuthError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Fallback: Si no tiene auth_user_id, borrar manualmente de public.usuarios
      const { error: deleteDbError } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('id', usuarioId)

      if (deleteDbError) {
        return NextResponse.json(
          { success: false, error: `Error al eliminar usuario de BD: ${deleteDbError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en delete-user:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
