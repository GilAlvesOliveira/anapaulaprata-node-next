import type { NextApiRequest, NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../../lib/types/RespostaPadraoMsg';
import { conectarMongoDB } from '../../../lib/middlewares/conectarMongoDB';
import { politicaCORS } from '../../../lib/middlewares/politicaCORS';
import { UsuarioModel } from '../../../lib/models/UsuarioModel';
import { sendPasswordResetEmail } from '../../../lib/services/emailService';
import crypto from 'crypto';
import nc from 'next-connect';

const handler = nc()
  .post(async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg>) => {
    try {
      const { email } = req.body as { email?: string };

      if (
        !email ||
        email.length < 5 ||
        !email.includes('@') ||
        !email.includes('.')
      ) {
        return res.status(400).json({ erro: 'Email inválido' });
      }

      const emailNormalizado = email.toLowerCase().trim();

      const usuario = await UsuarioModel.findOne({ email: emailNormalizado });

      // Por segurança, mesmo se não existir, respondemos "ok"
      if (!usuario) {
        return res.status(200).json({
          msg: 'Se este email estiver cadastrado, enviaremos um link de redefinição.',
        });
      }

      // Gera token aleatório
      const token = crypto.randomBytes(32).toString('hex');

      // Define validade de 1 hora (por exemplo)
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      usuario.resetPasswordToken = token;
      usuario.resetPasswordExpires = expires;
      await usuario.save();

      // Envia o email com o link de redefinição
      await sendPasswordResetEmail(emailNormalizado, token);

      return res.status(200).json({
        msg: 'Se este email estiver cadastrado, enviaremos um link de redefinição.',
      });
    } catch (e) {
      console.error('Erro ao solicitar redefinição de senha:', e);
      return res.status(500).json({ erro: 'Erro ao solicitar redefinição de senha' });
    }
  });

export default politicaCORS(conectarMongoDB(handler));
