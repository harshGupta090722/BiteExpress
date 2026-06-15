import { requireAdmin } from '@/lib/server/guards'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <>{children}</>
}
