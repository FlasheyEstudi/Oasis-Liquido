// OASIS - Automated Mailer Utility using Nodemailer & Gmail SMTP
// Supports secure, dependency-backed email dispatch with Google App Passwords

import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  code?: string;
}

export async function sendOasisEmail({
  to,
  subject,
  title,
  description,
  buttonText,
  buttonUrl,
  code
}: SendEmailParams): Promise<boolean> {
  const smtpUser = process.env.SMTP_USER || 'wendellflashey2023@gmail.com';
  const smtpPass = process.env.SMTP_PASS; // The 16-letter yellow App Password from Google

  // HTML responsive template styled with Oasis visual brand guidelines
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #334155;
        }
        .container {
          max-width: 580px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(13, 148, 136, 0.05);
          border: 1px solid #f1f5f9;
        }
        .header {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .header-logo {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header-logo span {
          color: #2dd4bf;
        }
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .desc {
          font-size: 15px;
          line-height: 1.6;
          color: #64748b;
          margin-bottom: 30px;
        }
        .code-box {
          background: #f0fdfa;
          border: 1px dashed #2dd4bf;
          border-radius: 16px;
          padding: 16px 24px;
          font-size: 24px;
          font-family: monospace;
          font-weight: 700;
          color: #0d9488;
          letter-spacing: 4px;
          display: inline-block;
          margin-bottom: 30px;
        }
        .btn {
          display: inline-block;
          background-color: #0d9488;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 30px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
          transition: all 0.3s ease;
        }
        .footer {
          background: #f8fafc;
          padding: 24px 20px;
          text-align: center;
          border-top: 1px solid #f1f5f9;
          font-size: 11px;
          color: #94a3b8;
        }
        .footer a {
          color: #0d9488;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="header-logo">Oasis<span>Líquida</span></h1>
        </div>
        <div class="content">
          <h2 class="title">${title}</h2>
          <p class="desc">${description}</p>
          
          ${code ? `<div class="code-box">${code}</div><br/>` : ''}
          
          <a href="${buttonUrl}" class="btn" target="_blank">${buttonText}</a>
        </div>
        <div class="footer">
          <p>Este correo electrónico fue generado automáticamente por Oasis Líquida.</p>
          <p>© 2026 Oasis Líquida. Tu oasis de salud digital.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // --- MODO 1: RESEND HTTP API (Recomendado para producción en Render, usa puerto HTTPS 443 estándar) ---
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      console.log(`✉️ Intentando enviar correo mediante Resend HTTP API a ${to}...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey.trim()}`
        },
        body: JSON.stringify({
          from: `Oasis Líquida <${fromEmail}>`,
          to: [to],
          subject,
          html: htmlContent
        })
      });

      const data = await response.json() as any;
      if (response.ok) {
        console.log(`✉️ Correo enviado exitosamente vía Resend HTTP API a ${to}. ID: ${data.id}`);
        return true;
      } else {
        console.error('❌ Error devuelto por la API de Resend:', data);
      }
    } catch (apiError) {
      console.error('❌ Error de conexión al llamar a la API de Resend:', apiError);
    }
  }

  // --- MODO 2: GMAIL SMTP FALLBACK (Para desarrollo local o si no hay API Key de Resend) ---
  if (!smtpPass) {
    console.warn('⚠️ Ni RESEND_API_KEY ni SMTP_PASS están configurados. Envío de correo omitido.');
    console.log(`🔑 [OASIS PASSWORD RECOVERY] User: ${to} | Recovery Code: ${code}`);
    return false;
  }

  try {
    const transporter = getTransporter(smtpUser, smtpPass);

    const mailOptions = {
      from: `"Oasis Líquida" <${smtpUser}>`,
      to,
      subject,
      html: htmlContent,
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Correo enviado exitosamente vía Gmail SMTP en pool a ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error crítico al enviar correo vía Gmail SMTP en pool:', error);
    return false;
  }
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(smtpUser: string, smtpPass: string): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const cleanSmtpPass = smtpPass.replace(/\s+/g, '');
  
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false for 587 (uses STARTTLS)
    pool: true,   // Reuses SMTP connections instead of creating new ones every single time!
    family: 4,    // Force IPv4 ONLY. This prevents Render's broken IPv6 stack from timing out!
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    auth: {
      user: smtpUser,
      pass: cleanSmtpPass
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 8000,
    socketTimeout: 15000
  } as any);

  return cachedTransporter;
}
