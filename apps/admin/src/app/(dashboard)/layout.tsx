import type { ReactNode } from 'react'
import { auth } from '@/lib/auth/auth.config'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/sidebar'
import { Header } from '@/components/shared/header'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — hidden on mobile, visible from md breakpoint */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          fullName={session.user.fullName}
          email={session.user.email}
          role={session.user.role}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
