import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API Route para crear usuarios confirmados automáticamente
 * Solo debe ser llamada desde el servidor (Server Actions o desde servicios)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      nombres,
      apellidos,
      apellido_paterno: apellidoPaternoBody,
      apellido_materno: apellidoMaternoBody,
      fecha_nacimiento: fechaNacimientoBody,
      genero: generoBody,
      numero_celular: numeroCelularBody,
      ci: ciBody,
      rol,
    } = body

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

    // Apellidos: aceptar apellido_paterno + apellido_materno o un solo "apellidos" (se divide)
    const apellidoPaterno =
      apellidoPaternoBody ??
      (typeof apellidos === 'string' ? apellidos.trim().split(/\s+/)[0] || 'Apellido' : 'Apellido')
    const apellidoMaterno =
      apellidoMaternoBody ??
      (typeof apellidos === 'string' ? apellidos.trim().split(/\s+/).slice(1).join(' ') || 'Apellido' : 'Apellido')
    const fechaNacimiento = fechaNacimientoBody || '1990-01-01'
    const genero = generoBody || 'Prefiero no decir'

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
    // El trigger handle_new_user crea la fila en usuarios usando estos metadata
    let authData, authError
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          nombres,
          apellido_paterno: apellidoPaterno,
          apellido_materno: apellidoMaterno,
          fecha_nacimiento: fechaNacimiento,
          genero,
          numero_celular: numeroCelularBody,
          ci: ciBody,
          user_type: rol === 'encargado' ? 'sensei' : rol === 'admin' ? 'admin' : rol || 'judoka',
          rol: rol || 'judoka',
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

    const authUserId = authData.user.id

    // El trigger handle_new_user crea la fila en usuarios; verificamos que exista
    const { data: usuarioRow, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()

    if (usuarioError || !usuarioRow) {
      console.error('Usuario no encontrado en tabla usuarios después del trigger:', usuarioError)
      return NextResponse.json(
        { success: false, error: 'El usuario se creó en Auth pero no se encontró en la base de datos. Revisa el trigger handle_new_user.' },
        { status: 500 }
      )
    }

    // Actualizar campos adicionales en usuarios que podrían no haber sido mapeados por el trigger
    const updateData: any = {}
    if (numeroCelularBody) updateData.numero_celular = numeroCelularBody
    if (ciBody) updateData.ci = ciBody

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin
        .from('usuarios')
        .update(updateData)
        .eq('id', usuarioRow.id)
    }

    // Si el rol es admin, insertar en la tabla admin
    const rolFinal = rol || 'judoka'
    if (rolFinal === 'admin') {
      const { error: adminError } = await supabaseAdmin.from('admin').insert({
        usuario_id: usuarioRow.id,
        activo: true,
      })
      if (adminError) {
        console.error('Error al crear registro en tabla admin:', adminError)
        return NextResponse.json(
          { success: false, error: `Usuario creado pero falló al asignar rol admin: ${adminError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { userId: authUserId, usuarioId: usuarioRow.id },
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

