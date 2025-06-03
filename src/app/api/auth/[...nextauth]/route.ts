import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  type SiweMessage,
  parseSiweMessage,
  validateSiweMessage,
} from 'viem/siwe';
import { verifyMessage } from 'viem/actions';
import { publicClient } from '@/components/WalletProvider';

function getAuthOptions(): NextAuthOptions {
  const providers = [
    CredentialsProvider({
      async authorize(
        credentials: Record<'message' | 'signature', string> | undefined
      ) {
        try {
          if (!credentials?.message || !credentials?.signature) {
            return null;
          }

          const siweMessage = parseSiweMessage(
            credentials.message,
          ) as SiweMessage;

          if (
            !validateSiweMessage({
              address: siweMessage?.address,
              message: siweMessage,
            })
          ) {
            return null;
          }

          let nextAuthUrl = process.env.NEXTAUTH_URL;
          if (!nextAuthUrl && process.env.VERCEL_URL) {
            nextAuthUrl = process.env.VERCEL_URL.startsWith('http')
              ? process.env.VERCEL_URL
              : `https://${process.env.VERCEL_URL}`;
          }
          if (!nextAuthUrl) {
            return null;
          }

          const nextAuthHost = new URL(nextAuthUrl).host;
          if (siweMessage.domain !== nextAuthHost) {
            return null;
          }

          // Ensure types for verifyMessage
          const address = siweMessage?.address as `0x${string}`;
          const signature = credentials.signature as `0x${string}`;

          const valid = await verifyMessage(publicClient, {
            address,
            message: credentials.message,
            signature,
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
        (session as typeof session & { address?: string }).address = token.sub;
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