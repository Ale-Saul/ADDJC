import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API Route para crear usuarios confirmados automáticamente
 * Solo debe ser llamada desde el servidor (Server Actions o desde servicios)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombres, apellidos, rol, club_id } = body

    // Validaciones con mensajes específicos
    if (!email) {
      console.error('Email faltante en la solicitud')
      return NextResponse.json(
        { success: false, error: 'Email es requerido' },
        { status: 400 }
      )
    }

    if (!password) {
      console.error('Password faltante en la solicitud')
      return NextResponse.json(
        { success: false, error: 'Contraseña es requerida' },
        { status: 400 }
      )
    }

    if (!nombres) {
      console.error('Nombres faltantes en la solicitud')
      return NextResponse.json(
        { success: false, error: 'Nombres son requeridos' },
        { status: 400 }
      )
    }

    if (!apellidos) {
      console.error('Apellidos faltantes en la solicitud')
      return NextResponse.json(
        { success: false, error: 'Apellidos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la Service Role Key esté configurada
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor')
      return NextResponse.json(
        { success: false, error: 'Error de configuración: Service Role Key no encontrada.' },
        { status: 500 }
      )
    }

    // Crear cliente admin dinámicamente para asegurar que las env vars estén disponibles
    let supabaseAdmin
    try {
      supabaseAdmin = createAdminClient()
    } catch (clientError) {
      console.error('Error al crear cliente Admin:', clientError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error de configuración del servidor.',
          details: clientError instanceof Error ? clientError.message : 'Error desconocido'
        },
        { status: 500 }
      )
    }

    // Crear usuario usando Admin API (auto-confirmado)
    let authData, authError
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
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
      authData = result.data
      authError = result.error
    } catch (createUserError) {
      console.error('Excepción al llamar a Supabase Admin API:', createUserError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al crear usuario: ${createUserError instanceof Error ? createUserError.message : 'Error desconocido'}`,
        },
        { status: 500 }
      )
    }

    if (authError) {
      console.error('Error al crear usuario con Admin API:', {
        message: authError.message,
        status: authError.status,
      })
      
      // Mensaje de error más descriptivo
      let errorMessage = authError.message || 'Error desconocido'
      
      // Mapear códigos de error comunes de Supabase
      if (authError.message?.includes('duplicate') || 
          authError.message?.includes('already exists') ||
          authError.message?.includes('already registered') ||
          (authError as any).code === 'PGRST204') {
        errorMessage = 'Este email ya está registrado en el sistema'
      } else if (authError.message?.includes('invalid') || 
                 authError.message?.includes('format') ||
                 authError.message?.includes('Invalid email')) {
        errorMessage = 'El formato del email no es válido'
      } else if (authError.message?.includes('password') || 
                 authError.message?.includes('Password')) {
        errorMessage = 'La contraseña no cumple con los requisitos mínimos'
      }
      
      // Retornar el error con el mensaje descriptivo
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: authError.message // Incluir el mensaje original para debugging
        },
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
        console.error('Error al crear perfil manualmente:', createProfileError.message)
        
        // Si falla crear el perfil, intentar eliminar el usuario de auth.users para mantener consistencia
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId)
          console.log('Usuario eliminado de auth.users debido a error al crear perfil')
        } catch (deleteError) {
          console.error('Error al eliminar usuario después de fallar crear perfil:', deleteError)
        }
        
        // Retornar error para que el usuario sepa que algo falló
        let errorMessage = createProfileError.message || 'Error desconocido'
        if (createProfileError.message?.includes('check constraint') || createProfileError.message?.includes('violates check')) {
          errorMessage = 'Error: El rol especificado no es válido. Verifica la configuración de la base de datos.'
        } else if (createProfileError.message?.includes('foreign key') || createProfileError.message?.includes('violates foreign key')) {
          errorMessage = 'Error: Problema con las relaciones de la base de datos. Contacta al administrador.'
        }
        
        return NextResponse.json(
          { success: false, error: `Error al crear perfil: ${errorMessage}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { userId },
    })
  } catch (error) {
    console.error('Error en API route create-user:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    // Determinar si es un error de configuración o un error de base de datos
    let statusCode = 500
    let userMessage = errorMessage
    
    if (errorMessage.includes('Service Role Key') || errorMessage.includes('SUPABASE')) {
      statusCode = 500
      userMessage = 'Error de configuración del servidor. Contacta al administrador.'
    } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
      statusCode = 400
      userMessage = errorMessage
    } else {
      statusCode = 500
      userMessage = `Error al crear usuario: ${errorMessage}`
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: userMessage,
        details: errorMessage // Para debugging
      },
      { status: statusCode }
    )
  }
}

