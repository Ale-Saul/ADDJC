import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * API Route para crear usuarios confirmados automáticamente
 * Solo debe ser llamada desde el servidor (Server Actions o desde servicios)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombres, apellidos, rol, club_id } = body

    // Validaciones
    if (!email || !password || !nombres || !apellidos) {
      return NextResponse.json(
        { success: false, error: 'Email, contraseña, nombres y apellidos son requeridos' },
        { status: 400 }
      )
    }

    // Crear usuario usando Admin API (auto-confirmado)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nombres,
        apellidos,
        user_type: rol === 'encargado' ? 'sensei' : rol, // encargado usa user_type 'sensei'
        rol: rol || 'judoka',
        club_id: club_id || null,
      },
    })

    if (authError) {
      console.error('Error al crear usuario con Admin API:', authError)
      return NextResponse.json(
        { success: false, error: `Error al crear usuario: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'No se pudo crear el usuario' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // El perfil se crea automáticamente por el trigger handle_new_user
    // Pero verificamos que se haya creado correctamente
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.warn('Perfil no encontrado después de crear usuario, creándolo manualmente:', profileError)
      // Crear perfil manualmente si el trigger no funcionó
      const { error: createProfileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          nombres,
          apellidos,
          user_type: rol === 'encargado' ? 'sensei' : rol,
          rol: rol || 'judoka',
          club_id: club_id || null,
          activo: true,
        })

      if (createProfileError) {
        console.error('Error al crear perfil manualmente:', createProfileError)
        // Continuar de todas formas, el usuario ya está creado
      }
    }

    return NextResponse.json({
      success: true,
      data: { userId },
    })
  } catch (error) {
    console.error('Error en API route create-user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

