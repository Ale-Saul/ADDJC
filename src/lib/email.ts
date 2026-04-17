import nodemailer from 'nodemailer'

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Envía un correo electrónico
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Credenciales de correo no configuradas. No se envió el correo a:', to)
      return { success: false, error: 'Credenciales de correo no configuradas' }
    }

    const info = await transporter.sendMail({
      from: `"Asociación Departamental de Judo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })

    return { success: true, data: info }
  } catch (error) {
    console.error('Error al enviar correo:', error)
    return { success: false, error }
  }
}

/**
 * Genera el HTML para el correo de bienvenida con credenciales
 */
export function getWelcomeEmailTemplate(nombre: string, carnet: string, password: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1976d2;">Bienvenido a la Asociación de Judo</h1>
      </div>
      
      <p>Hola <strong>${nombre}</strong>,</p>
      
      <p>Tu cuenta ha sido creada exitosamente en el sistema de gestión de la Asociación Departamental de Judo.</p>
      
      <p>A continuación encontrarás tus credenciales de acceso:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Usuario (Email):</strong> Tu correo electrónico</p>
        <p style="margin: 5px 0;"><strong>Carnet de Identidad:</strong> ${carnet}</p>
        <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; font-size: 16px; background-color: #e3f2fd; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
      </div>
      
      <p style="color: #d32f2f; font-weight: bold;">Importante:</p>
      <p>Por seguridad, el sistema te pedirá cambiar esta contraseña temporal la primera vez que inicies sesión.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Iniciar Sesión</a>
      </div>
      
      <hr style="margin-top: 40px; border: none; border-top: 1px solid #e0e0e0;" />
      
      <p style="font-size: 12px; color: #757575; text-align: center;">
        Este es un correo automático, por favor no respondas a este mensaje.
      </p>
    </div>
  `
}
