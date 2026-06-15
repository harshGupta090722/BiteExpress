'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const role = session?.user?.role

  // Public links everyone sees; staff/admin links are appended by role.
  const navItems: { href: string; label: string }[] = [
    { href: '/', label: 'Menu' },
    { href: '/track', label: 'Track Order' },
  ]
  if (role === 'STAFF' || role === 'ADMIN') {
    navItems.push({ href: '/staff', label: 'Staff' })
  }
  if (role === 'ADMIN') {
    navItems.push({ href: '/admin', label: 'Admin' })
  }

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">Food Orders</h1>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href ? 'bg-gray-800' : 'hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            {status === 'loading' ? null : session?.user ? (
              <>
                <span className="hidden sm:inline text-gray-300">
                  {session.user.name || session.user.email}
                  {role && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-700 text-xs">{role}</span>
                  )}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/login' ? 'bg-gray-800' : 'hover:bg-gray-700'
                }`}
              >
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
