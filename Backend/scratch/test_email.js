const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpUser = process.env.SMTP_USER || 'wendellflashey2023@gmail.com';
const smtpPass = process.env.SMTP_PASS || 'kssulmwcpxxuodyl';

console.log('Testing SMTP connection with:');
console.log('User:', smtpUser);
console.log('Pass length:', smtpPass.replace(/\s+/g, '').length);

const cleanSmtpPass = smtpPass.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: cleanSmtpPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mailOptions = {
  from: `"Oasis Líquida Test" <${smtpUser}>`,
  to: 'francohernandez2070@gmail.com',
  subject: 'Prueba de Conexión SMTP - Oasis Líquida',
  text: 'Este es un correo de prueba para verificar la entrega instantánea.',
  html: '<h1>Oasis Líquida</h1><p>Prueba de entrega SMTP exitosa.</p>'
};

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to send email:');
    console.error(err);
    process.exit(1);
  });
