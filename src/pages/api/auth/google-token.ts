import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import jwt from 'jsonwebtoken';

import { authOptions } from './[...nextauth]';
import { UsuarioModel } from '../../../lib/models/UsuarioModel';
import { conectarMongoDB } from '../../../lib/middlewares/conectarMongoDB';
import { politicaCORS } from '../../../lib/middlewares/politicaCORS';

type UsuarioPayload = {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  role?: string;
};

type GoogleTokenResponse = {
  token: string;
  usuario: UsuarioPayload;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GoogleTokenResponse | { erro: string }>
) {
  // Só vamos aceitar GET
  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    // Lê a sessão do NextAuth (cookie do Google)
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res
        .status(401)
        .json({ erro: 'Usuário não autenticado pelo Google.' });
    }

    const email = session.user.email;

    // Já estamos conectando via conectarMongoDB (middleware),
    // então aqui podemos só usar o model normalmente
    const usuarioDb = await UsuarioModel.findOne({ email });

    if (!usuarioDb) {
      return res.status(404).json({
        erro: 'Usuário não encontrado na base após login com Google.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res
        .status(500)
        .json({ erro: 'JWT_SECRET não configurado no servidor.' });
    }

    // Gera o mesmo tipo de token que você usa no login normal
    const token = jwt.sign(
      {
        _id: usuarioDb._id.toString(),
        email: usuarioDb.email,
        role: usuarioDb.role,
      },
      jwtSecret,
      {
        expiresIn: '7d',
      }
    );

    const usuarioPayload: UsuarioPayload = {
      id: usuarioDb._id.toString(),
      nome: usuarioDb.nome,
      email: usuarioDb.email,
      avatar: usuarioDb.avatar,
      role: usuarioDb.role,
    };

    return res.status(200).json({
      token,
      usuario: usuarioPayload,
    });
  } catch (e) {
    console.error('Erro em /api/auth/google-token:', e);
    return res
      .status(500)
      .json({ erro: 'Erro ao gerar token para login com Google.' });
  }
}

// 🔴 IMPORTANTE: usar os MESMOS middlewares das outras rotas (CORS + Mongo)
export default politicaCORS(conectarMongoDB(handler));