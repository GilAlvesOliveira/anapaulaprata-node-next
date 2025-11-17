import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // Aqui configuramos os provedores de login (Google, GitHub, etc.)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Tipo de sessão: JWT (padrão)
  session: {
    strategy: "jwt",
  },

  // Callbacks: permitem customizar o token e a sessão
  callbacks: {
    // Esse callback roda toda vez que o token JWT é criado/atualizado
    async jwt({ token, account, profile }) {
      // Quando o usuário loga pela primeira vez com Google
      if (account && profile) {
        token.email = profile.email;
        token.name = profile.name;
        // picture não vem tipado no profile, então usamos "as any"
        token.picture = (profile as any).picture;
      }
      return token;
    },

    // Esse callback define o que vai para "session" no front
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          email: token.email as string,
          name: token.name as string,
          image: token.picture as string,
        };
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
