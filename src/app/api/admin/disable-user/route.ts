import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * API Route para deshabilitar usuarios en auth.users
 * Esto permite que el email pueda ser usado de nuevo para registrarse
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId es requerido' },
        { status: 400 }
      )
    }

    // Opción 1: Eliminar completamente el usuario (permitirá reutilizar el email)
    // Esto es lo que permite que el email se pueda usar de nuevo
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error al eliminar usuario:', deleteError)
      return NextResponse.json(
        { success: false, error: `Error al eliminar usuario: ${deleteError.message}` },
        { status: 400 }
      )
    }

    // También marcar el perfil como inactivo si aún existe
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ activo: false })
      .eq('id', userId)

    if (profileError) {
      console.warn('Error al actualizar user_profiles:', profileError)
      // No fallar porque el usuario ya fue eliminado de auth.users
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error en API route disable-user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

