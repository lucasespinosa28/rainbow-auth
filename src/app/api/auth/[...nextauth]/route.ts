import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  type SiweMessage,
  parseSiweMessage,
  validateSiweMessage,
} from 'viem/siwe';
import { verifyMessage } from 'viem/actions';
import { publicClient } from '@/components/WalletProvider';

export function getAuthOptions(): NextAuthOptions {
  const providers = [
    CredentialsProvider({
      async authorize(credentials: any) {
        try {
          const siweMessage = parseSiweMessage(
            credentials?.message,
          ) as SiweMessage;

          if (
            !validateSiweMessage({
              address: siweMessage?.address,
              message: siweMessage,
            })
          ) {
            return null;
          }

          const nextAuthUrl =
            process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : null);
          if (!nextAuthUrl) {
            return null;
          }

          const nextAuthHost = new URL(nextAuthUrl).host;
          if (siweMessage.domain !== nextAuthHost) {
            return null;
          }

          const valid = await verifyMessage(publicClient, {
            address: siweMessage?.address,
            message: credentials?.message,
            signature: credentials?.signature,
          });

          if (!valid) {
            return null;
          }

          return {
            id: siweMessage.address,
          };
        } catch (e) {
          console.error('Error authorizing user', e);
          return null;
        }
      },
      credentials: {
        message: {
          label: 'Message',
          placeholder: '0x0',
          type: 'text',
        },
        signature: {
          label: 'Signature',
          placeholder: '0x0',
          type: 'text',
        },
      },
      name: 'Ethereum',
    }),
  ];

  return {
    callbacks: {
      async session({ session, token }) {
        session.address = token.sub;
        session.user = {
          name: token.sub,
        };
        return session;
      },
    },
    providers,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: 'jwt',
    },
  };
}

const handler = NextAuth(getAuthOptions());

export { handler as GET, handler as POST };