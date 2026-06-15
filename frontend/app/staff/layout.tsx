import { requireStaff } from '@/lib/server/guards'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireStaff()
  return <>{children}</>
}
