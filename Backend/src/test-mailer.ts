import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testMail() {
  const smtpUser = process.env.SMTP_USER || 'wendellflashey2023@gmail.com';
  const smtpPass = process.env.SMTP_PASS;

  console.log('📧 Testing SMTP Dispatch...');
  console.log(`SMTP_USER: ${smtpUser}`);
  console.log(`SMTP_PASS length: ${smtpPass ? smtpPass.length : 0}`);
  
  if (!smtpPass) {
    console.error('❌ Error: SMTP_PASS is undefined in .env file!');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const mailOptions = {
    from: `"Oasis Test" <${smtpUser}>`,
    to: 'fifeflash02@gmail.com',
    subject: 'Oasis SMTP Test',
    text: 'If you receive this, Nodemailer is working perfectly with Gmail SMTP!'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Success! Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error);
  }
}

testMail();
