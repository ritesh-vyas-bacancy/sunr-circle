import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import { auth } from '@/lib/auth/auth.config'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata: Metadata = {
  title: 'Sign In | SUNR Circle Admin',
  description: 'Sign in to SUNR Circle Admin Portal',
}

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top government-style banner */}
      <header className="bg-[#1a3d7c] py-4 px-6 flex items-center gap-3 shadow-md">
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-white text-lg font-bold tracking-wide">SUNR Circle</span>
          <span className="text-blue-200 text-sm ml-3 hidden sm:inline">
            Electricity Utility
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Card header accent */}
            <div className="bg-[#1a3d7c] px-6 py-5">
              <h1 className="text-xl font-bold text-white">Admin Portal</h1>
              <p className="text-blue-200 text-sm mt-1">Complaint Management System</p>
            </div>

            {/* Form area */}
            <div className="px-6 py-7">
              <p className="text-sm text-gray-600 mb-6">
                Sign in with your official credentials to access the portal.
              </p>
              <LoginForm />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center">
        <p className="text-xs text-gray-500">
          SUNR Circle Electricity Utility | Complaint Management System
        </p>
      </footer>
    </div>
  )
}
