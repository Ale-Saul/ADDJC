import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Elimina un árbitro de forma real:
 * 1. Borra la fila en arbitros
 * 2. Obtiene auth_user_id de usuarios y elimina el usuario en auth.users
 * 3. Borra la fila en usuarios
 * Así el árbitro y el usuario desaparecen de la BD y el email puede reutilizarse.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { arbitroId } = body

    if (!arbitroId) {
      return NextResponse.json(
        { success: false, error: 'arbitroId es requerido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    const { data: arbitro, error: errArbitro } = await supabaseAdmin
      .from('arbitros')
      .select('id, usuario_id')
      .eq('id', arbitroId)
      .single()

    if (errArbitro || !arbitro) {
      return NextResponse.json(
        { success: false, error: 'Árbitro no encontrado' },
        { status: 404 }
      )
    }

    const usuarioId = arbitro.usuario_id

    const { data: usuario, error: errUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, auth_user_id')
      .eq('id', usuarioId)
      .single()

    if (errUsuario || !usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario del árbitro no encontrado' },
        { status: 404 }
      )
    }

    const authUserId = usuario.auth_user_id

    const { error: deleteArbitroError } = await supabaseAdmin
      .from('arbitros')
      .delete()
      .eq('id', arbitroId)

    if (deleteArbitroError) {
      console.error('Error al borrar árbitro:', deleteArbitroError)
      return NextResponse.json(
        { success: false, error: `Error al eliminar árbitro: ${deleteArbitroError.message}` },
        { status: 500 }
      )
    }

    if (authUserId) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
      if (deleteAuthError) {
        console.warn('Error al eliminar usuario de Auth:', deleteAuthError)
      }
    }

    await supabaseAdmin.from('certificaciones').delete().eq('usuario_id', usuarioId)
    await supabaseAdmin.from('pagos').update({ creador_id: null }).eq('creador_id', usuarioId)
    await supabaseAdmin.from('movimientos_financieros').update({ created_by: null }).eq('created_by', usuarioId)

    const { error: deleteUsuarioError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', usuarioId)

    if (deleteUsuarioError) {
      console.error('Error al borrar usuario:', deleteUsuarioError)
      return NextResponse.json(
        { success: false, error: `Error al eliminar usuario: ${deleteUsuarioError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en delete-arbitro:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
