import { redirect } from 'next/navigation'
import { auth, signIn } from '@/auth'

export const metadata = {
  title: 'BiteExpress - Staff Login',
}

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Staff & Admin Login</h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in to manage orders and view the dashboard.
        </p>

        <form
          action={async () => {
            'use server'
            await signIn('auth0', { redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Sign in with Auth0
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Customers don&apos;t need an account &mdash; just place an order from the menu and track it
          with your order ID.
        </p>
      </div>
    </div>
  )
}
