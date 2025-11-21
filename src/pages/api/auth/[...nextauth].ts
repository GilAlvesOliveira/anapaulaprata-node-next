import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// imports relativos ao seu projeto
import { connectToDatabase } from '../../../lib/mongoose';
import { UsuarioModel } from '../../../lib/models/UsuarioModel';

// Garante que o NextAuth saiba qual é a URL base da API (backend)
if (!process.env.NEXTAUTH_URL && process.env.APP_URL) {
  process.env.NEXTAUTH_URL = process.env.APP_URL;
}

// URL do frontend para onde o usuário deve ser enviado depois de logar
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // 🔁 Depois de login / logout, para onde o usuário vai?
    async redirect({ url, baseUrl }) {
      // Se já estiver indo para o FRONTEND_URL, deixa passar
      if (url.startsWith(FRONTEND_URL)) {
        return url;
      }

      // Qualquer outra coisa (inclusive baseUrl do backend) → manda para o frontend
      return FRONTEND_URL;
    },

    async jwt({ token, account, profile }) {
      if (account && profile) {
        await connectToDatabase();

        const email = profile.email as string | undefined;
        if (!email) return token;

        let usuario = await UsuarioModel.findOne({ email });

        if (!usuario) {
          usuario = await UsuarioModel.create({
            nome: profile.name || 'Usuário',
            email,
            avatar: (profile as any).picture,
            role: 'customer',
          });
        }

        token.id = usuario._id.toString();
        token.email = usuario.email;
        token.name = usuario.nome;
        token.picture = usuario.avatar;
        (token as any).role = usuario.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        (session.user as any).role = (token as any).role;
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);