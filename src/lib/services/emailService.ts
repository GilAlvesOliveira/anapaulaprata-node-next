// src/middleweres/services/emailService.ts
import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  APP_URL,
  FRONTEND_URL,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
  console.warn(
    '⚠ Variáveis de ambiente de email (SMTP) não estão completamente configuradas. ' +
      'Funcionalidade de reset de senha pode não funcionar corretamente.'
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: false, // se usar 465, mude para true
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  // Base do link: de preferência o FRONTEND_URL; se não tiver, cai pro APP_URL
  const baseUrl = FRONTEND_URL || APP_URL;

  if (!baseUrl) {
    throw new Error(
      'FRONTEND_URL ou APP_URL não configurados nas variáveis de ambiente.'
    );
  }

  const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
    email
  )}`;

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: 'Redefinição de senha - Sua conta',
    html: `
      <p>Você solicitou a redefinição de senha.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Se você não fez essa solicitação, apenas ignore este email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}