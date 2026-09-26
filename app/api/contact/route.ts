import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Validación básica de formato de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Verificar que las variables de entorno existen
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!apiKey) {
      console.error('RESEND_API_KEY no está configurada');
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    if (!fromEmail) {
      console.error('FROM_EMAIL no está configurada');
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    if (!contactEmail) {
      console.error('CONTACT_EMAIL no está configurada');
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Parsear body JSON
    const body = await request.json();
    const { name, email, msg } = body;

    // Validar campos requeridos
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedMsg = (msg || '').trim();

    if (!trimmedName) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!trimmedEmail) {
      return NextResponse.json(
        { success: false, error: 'El email es requerido' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: 'El formato del email es inválido' },
        { status: 400 }
      );
    }

    if (!trimmedMsg) {
      return NextResponse.json(
        { success: false, error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    if (trimmedMsg.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'El mensaje no puede exceder 1000 caracteres' },
        { status: 400 }
      );
    }

    // Crear cliente Resend
    const resend = new Resend(apiKey);

    // Construir el cuerpo del email
    const emailBody = `Nuevo mensaje de contacto desde Arcade Vault:

Nombre: ${trimmedName}
Email: ${trimmedEmail}

Mensaje:
${trimmedMsg}

---
Enviado desde Arcade Vault`;

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: trimmedEmail,
      subject: 'Nuevo mensaje desde Arcade Vault',
      text: emailBody,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return NextResponse.json(
        { success: false, error: 'Error al enviar el mensaje. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    console.log('Email enviado exitosamente:', data);

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente',
    });

  } catch (error) {
    console.error('Error en /api/contact:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
