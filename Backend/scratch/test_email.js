const fetch = require('node-fetch'); // fallback or native
require('dotenv').config();

const resendApiKey = process.env.RESEND_API_KEY || 're_46NRDE8U_JWWbLq2CVcqpELysxivXxtjd';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const targetEmail = 'wendellflashey2023@gmail.com'; // User's email

console.log('Testing Resend API connection with:');
console.log('API Key:', resendApiKey.substring(0, 10) + '...');
console.log('From:', fromEmail);
console.log('To:', targetEmail);

async function testResend() {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey.trim()}`
      },
      body: JSON.stringify({
        from: `Oasis Líquida <${fromEmail}>`,
        to: [targetEmail],
        subject: 'Prueba de Entrega HTTP - Resend',
        html: '<h1>Oasis Líquida</h1><p>¡Felicidades! La entrega mediante Resend HTTP API funciona al 100%.</p>'
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Email successfully sent via Resend API!');
      console.log('Response:', data);
      process.exit(0);
    } else {
      console.error('❌ Resend API returned an error:', data);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }
}

testResend();
