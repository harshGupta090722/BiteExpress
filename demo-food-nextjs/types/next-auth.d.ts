import type { DefaultSession } from 'next-auth'
import type { AppRole } from '@/lib/server/syncUser'

declare module 'next-auth' {
  interface Session {
    backendToken?: string
    user: {
      id: string
      role: AppRole
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string
    role?: AppRole
  }
}
