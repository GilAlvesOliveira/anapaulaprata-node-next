import type { NextApiRequest, NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../../lib/types/RespostaPadraoMsg';
import nc from 'next-connect';
import { politicaCORS } from '../../../lib/middlewares/politicaCORS';
import { conectarMongoDB } from '../../../lib/middlewares/conectarMongoDB';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import jwt from 'jsonwebtoken';

type UsuarioResposta = {
  id: string;
  nome: string;
  email: string;
  role?: string;
  avatar?: string | null;
};

type RespostaMeGoogle = {
  msg: string;
  token: string;
  usuario: UsuarioResposta;
};

const handler = nc<NextApiRequest, NextApiResponse<RespostaPadraoMsg | RespostaMeGoogle>>()
  .get(async (req, res) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({ erro: 'Não autenticado' });
      }

      const userAny = session.user as any;
      const id = userAny.id as string | undefined;
      const email = userAny.email as string | undefined;
      const nome = userAny.name as string | undefined;
      const role = userAny.role as string | undefined;
      const avatar = userAny.image as string | undefined;

      if (!id || !email) {
        return res.status(400).json({ erro: 'Sessão inválida' });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('JWT_SECRET não configurado');
        return res.status(500).json({ erro: 'Configuração inválida do servidor' });
      }

      const token = jwt.sign(
        { id, email, role: role || 'customer' },
        secret,
        { expiresIn: '1h' }
      );

      const usuario: UsuarioResposta = {
        id,
        nome: nome || '',
        email,
        role,
        avatar: avatar || null,
      };

      return res.status(200).json({
        msg: 'Usuário autenticado via Google',
        token,
        usuario,
      });
    } catch (e) {
      console.error('Erro em /api/auth/me-google:', e);
      return res.status(500).json({ erro: 'Erro ao obter usuário autenticado' });
    }
  });

export default politicaCORS(conectarMongoDB(handler));