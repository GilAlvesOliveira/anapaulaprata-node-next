import type { NextApiRequest, NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../../lib/types/RespostaPadraoMsg';
import type { LoginRequisicao } from '../../../lib/types/LoginRequisicao.ts';
import { UsuarioModel } from '../../../lib/models/UsuarioModel';
import { conectarMongoDB } from '../../../lib/middlewares/conectarMongoDB';
import md5 from 'md5';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nc from 'next-connect';
import { politicaCORS } from '../../../lib/middlewares/politicaCORS';

const handler = nc()
  .post(async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg | any>) => {
    try {
      const usuario = req.body as LoginRequisicao;

      // Validação dos campos
      if (
        !usuario.email ||
        usuario.email.length < 5 ||
        !usuario.email.includes('@') ||
        !usuario.email.includes('.')
      ) {
        return res.status(400).json({ erro: 'Email inválido' });
      }

      if (!usuario.senha || usuario.senha.length < 4) {
        return res.status(400).json({ erro: 'Senha inválida' });
      }

      // Normaliza email
      const emailNormalizado = usuario.email.toLowerCase().trim();

      // Buscar usuário no MongoDB
      const usuarioExistente = await UsuarioModel.findOne({ email: emailNormalizado });
      if (!usuarioExistente) {
        return res.status(400).json({ erro: 'Email ou senha incorretos' });
      }

      // Se o usuário é apenas Google (sem senha definida)
      if (!usuarioExistente.senha) {
        return res.status(400).json({ erro: 'Esta conta só pode ser acessada via login com Google' });
      }

      const hashArmazenado = usuarioExistente.senha;

      let senhaCorreta = false;

      // Verifica se o hash atual é bcrypt (começa com $2a$, $2b$ ou $2y$)
      const ehBcrypt =
        hashArmazenado.startsWith('$2a$') ||
        hashArmazenado.startsWith('$2b$') ||
        hashArmazenado.startsWith('$2y$');

      if (ehBcrypt) {
        // Validação padrão com bcrypt
        senhaCorreta = await bcrypt.compare(usuario.senha, hashArmazenado);
      } else {
        // Hash antigo em MD5
        if (hashArmazenado === md5(usuario.senha)) {
          senhaCorreta = true;

          // Migração automática: troca MD5 por bcrypt
          const novoHashBcrypt = await bcrypt.hash(usuario.senha, 10);
          usuarioExistente.senha = novoHashBcrypt;
          await usuarioExistente.save();
        } else {
          senhaCorreta = false;
        }
      }

      if (!senhaCorreta) {
        return res.status(400).json({ erro: 'Email ou senha incorretos' });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { id: usuarioExistente._id, email: usuarioExistente.email, role: usuarioExistente.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      // Retornar dados do usuário e token
      return res.status(200).json({
        msg: 'Login realizado com sucesso',
        token,
        usuario: {
          id: usuarioExistente._id,
          nome: usuarioExistente.nome,
          email: usuarioExistente.email,
          role: usuarioExistente.role,
          avatar: usuarioExistente.avatar || null,
        },
      });
    } catch (e) {
      console.error('Erro ao fazer login:', e);
      return res.status(500).json({ erro: 'Erro ao fazer login' });
    }
  });

export default politicaCORS(conectarMongoDB(handler));