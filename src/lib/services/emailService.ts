import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  APP_URL,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !APP_URL) {
  console.warn(
    '⚠ Variáveis de ambiente de email não estão completamente configuradas. ' +
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
  if (!APP_URL) {
    throw new Error('APP_URL não configurado nas variáveis de ambiente.');
  }

  const resetLink = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

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
