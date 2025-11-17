import type { NextApiRequest, NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../../lib/types/RespostaPadraoMsg';
import { conectarMongoDB } from '../../../lib/middlewares/conectarMongoDB';
import { politicaCORS } from '../../../lib/middlewares/politicaCORS';
import { UsuarioModel } from '../../../lib/models/UsuarioModel';
import bcrypt from 'bcrypt';
import nc from 'next-connect';

const handler = nc()
  .post(async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg>) => {
    try {
      const { email, token, novaSenha } = req.body as {
        email?: string;
        token?: string;
        novaSenha?: string;
      };

      if (
        !email ||
        email.length < 5 ||
        !email.includes('@') ||
        !email.includes('.')
      ) {
        return res.status(400).json({ erro: 'Email inválido' });
      }

      if (!token || token.length < 10) {
        return res.status(400).json({ erro: 'Token inválido' });
      }

      if (!novaSenha || novaSenha.length < 4) {
        return res.status(400).json({ erro: 'Senha inválida' });
      }

      const emailNormalizado = email.toLowerCase().trim();

      const usuario = await UsuarioModel.findOne({
        email: emailNormalizado,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }, // ainda não expirou
      });

      if (!usuario) {
        return res.status(400).json({
          erro: 'Token inválido ou expirado. Solicite uma nova redefinição de senha.',
        });
      }

      // Gera novo hash da senha via bcrypt
      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

      usuario.senha = novaSenhaHash;
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpires = undefined;

      await usuario.save();

      return res.status(200).json({ msg: 'Senha redefinida com sucesso.' });
    } catch (e) {
      console.error('Erro ao redefinir senha:', e);
      return res.status(500).json({ erro: 'Erro ao redefinir senha' });
    }
  });

export default politicaCORS(conectarMongoDB(handler));
