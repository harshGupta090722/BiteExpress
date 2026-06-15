import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { AppRole } from './syncUser'

// Server-side guards for protected areas. Used inside route layouts so the
// check runs in the Node.js runtime (where signing the backend JWT works).

export async function requireRole(roles: AppRole[]) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  if (!roles.includes(session.user.role)) {
    redirect('/')
  }
  return session
}

export const requireStaff = () => requireRole(['STAFF', 'ADMIN'])
export const requireAdmin = () => requireRole(['ADMIN'])
