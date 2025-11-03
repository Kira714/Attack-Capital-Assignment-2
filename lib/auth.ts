/**
 * NextAuth v5 configuration
 * Supports credentials and Google OAuth with role-based access control
 */
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        // In production, hash passwords with bcrypt
        // For demo purposes, simple check
        const isValid = credentials.password === 'password'; // Replace with actual hash check

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        // Create or update user from Google OAuth
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name || profile?.name,
            image: user.image || (profile as any)?.picture,
            emailVerified: new Date(),
          },
          create: {
            email: user.email,
            name: user.name || profile?.name || 'Google User',
            image: user.image || (profile as any)?.picture,
            role: 'VIEWER',
            emailVerified: new Date(),
          },
        });
        user.id = dbUser.id;
        (user as any).role = dbUser.role;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'VIEWER';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

