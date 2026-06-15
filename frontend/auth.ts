import NextAuth from 'next-auth'
import Auth0 from 'next-auth/providers/auth0'
import jwt from 'jsonwebtoken'
import { syncUser, type AppRole } from '@/lib/server/syncUser'

// Auth.js v5 config. Auth0() automatically reads AUTH_AUTH0_ID / AUTH_AUTH0_SECRET
// / AUTH_AUTH0_ISSUER from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Auth0],
  session: { strategy: 'jwt' },
  callbacks: {
    // Runs on sign-in (and subsequent token refreshes). On first sign-in we
    // sync the user into Postgres via the Apollo server and capture their role.
    async jwt({ token, account, profile }) {
      if (account && token.email) {
        const synced = await syncUser({
          email: token.email,
          name: (profile?.name as string) ?? token.name,
          image: (profile?.picture as string) ?? (token.picture as string | undefined),
        })
        if (synced) {
          token.uid = synced.id
          token.role = synced.role
        } else {
          token.role = 'CUSTOMER'
        }
      }
      return token
    },

    // Expose id + role to the client, and mint a short-lived backend JWT that
    // the Apollo server can verify with the shared secret.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? ''
        session.user.role = (token.role as AppRole) ?? 'CUSTOMER'
      }

      const secret = process.env.AUTH_SHARED_SECRET
      if (secret && token.uid) {
        session.backendToken = jwt.sign(
          {
            sub: token.uid as string,
            email: token.email,
            role: (token.role as AppRole) ?? 'CUSTOMER',
          },
          secret,
          { expiresIn: '1h' }
        )
      }
      return session
    },
  },
})
