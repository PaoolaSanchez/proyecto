// email-service.js - Servicio para envío de correos electrónicos
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    // Verificar si las credenciales están configuradas
    if (!emailUser || !emailPassword || emailUser.trim() === '' || emailPassword.trim() === '') {
      console.log('⚠️  EMAIL NO CONFIGURADO - Los correos se simularán en los logs');
      console.log('   Para enviar correos reales, configura EMAIL_USER y EMAIL_PASSWORD en .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.isConfigured = true;
      console.log('✅ Servicio de email configurado correctamente');
      console.log(`   Enviando desde: ${emailUser}`);
    } catch (error) {
      console.error('❌ Error al configurar el servicio de email:', error.message);
      this.isConfigured = false;
    }
  }

  async sendVerificationEmail(to, verificationLink, userName = 'Usuario') {
    const subject = '✈️ Verifica tu cuenta en TravelPlus';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .logo { font-size: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✈️</div>
            <h1 style="margin: 10px 0 0 0;">TravelPlus</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${userName}! 👋</h2>
            <p>Gracias por registrarte en <strong>TravelPlus</strong>. Estamos emocionados de tenerte con nosotros.</p>
            <p>Para completar tu registro y comenzar a explorar destinos increíbles, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verificar mi correo electrónico</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">${verificationLink}</a>
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              <strong>Nota:</strong> Este enlace expirará en 1 hora por seguridad.
            </p>
          </div>
          <div class="footer">
            <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
            <p>© 2025 TravelPlus. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(to, subject, html);
  }

  async sendTripInvitationEmail(to, invitationLink, tripName, senderName = 'Un amigo') {
    const subject = `✈️ ${senderName} te invita a unirte a un viaje en TravelPlus`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .logo { font-size: 32px; }
          .trip-name { background: #EEF2FF; padding: 15px 25px; border-radius: 10px; font-size: 20px; font-weight: bold; color: #667eea; margin: 20px 0; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✈️</div>
            <h1 style="margin: 10px 0 0 0;">¡Te han invitado a un viaje!</h1>
          </div>
          <div class="content">
            <h2>¡Hola! 👋</h2>
            <p><strong>${senderName}</strong> te ha invitado a unirte a un viaje increíble:</p>
            <div style="text-align: center;">
              <div class="trip-name">🌍 ${tripName}</div>
            </div>
            <p>¡No te pierdas esta aventura! Haz clic en el botón para unirte al viaje y comenzar a planificar juntos.</p>
            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">🎉 Unirme al viaje</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${invitationLink}" style="color: #667eea; word-break: break-all;">${invitationLink}</a>
            </p>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático de TravelPlus.</p>
            <p>© 2025 TravelPlus. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(to, subject, html);
  }

  async sendEmail(to, subject, html) {
    // Si el email no está configurado, simular envío
    if (!this.isConfigured) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL SIMULADO (Configura .env para envío real)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Para: ${to}`);
      console.log(`Asunto: ${subject}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Extraer el link del HTML
      const linkMatch = html.match(/href="([^"]+verify-email[^"]+)"/);
      if (linkMatch) {
        console.log('🔗 Link de verificación:');
        console.log(linkMatch[1]);
        console.log('\n');
      }
      
      return { success: true, simulated: true };
    }

    // Envío real
    try {
      const info = await this.transporter.sendMail({
        from: `"TravelPlus ✈️" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
      });

      console.log(`✅ Email enviado exitosamente a ${to}`);
      console.log(`   ID del mensaje: ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (error) {
      console.error(`❌ Error al enviar email a ${to}:`, error.message);
      throw error;
    }
  }

  // Verificar la configuración del transporter
  async verifyConnection() {
    if (!this.isConfigured) {
      return { success: false, message: 'Email no configurado' };
    }

    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Error al verificar conexión SMTP:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Exportar una instancia única (singleton)
module.exports = new EmailService();
