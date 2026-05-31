import Link from 'next/link'
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  FileText,
  BarChart3,
  Zap,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { auth } from '@/lib/auth/auth.config'
import { logoutAction } from '@/features/auth/actions/auth.actions'
import { getRoleLabel } from '@/lib/utils'
import type { UserRole } from '@/types'
import { SidebarNavClient } from './sidebar-nav-client'

interface NavChild {
  label: string
  href: string
}

interface NavItem {
  label: string
  href?: string
  icon: string
  children?: NavChild[]
}

const navItems: Record<string, NavItem[]> = {
  back_office: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Organisation', href: '/organisation', icon: 'Building2' },
    {
      label: 'Offices',
      icon: 'MapPin',
      children: [
        { label: 'Circles', href: '/offices/circles' },
        { label: 'Divisions', href: '/offices/divisions' },
        { label: 'Sub Divisions', href: '/offices/sub-divisions' },
      ],
    },
    { label: 'Users', href: '/users', icon: 'Users' },
    { label: 'Complaints', href: '/complaints', icon: 'FileText' },
    { label: 'Reports', href: '/reports', icon: 'BarChart3' },
  ],
  top_management: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Complaints', href: '/complaints', icon: 'FileText' },
    { label: 'Reports', href: '/reports', icon: 'BarChart3' },
  ],
  call_centre: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Complaints', href: '/complaints', icon: 'FileText' },
  ],
  line_man: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Complaints', href: '/complaints', icon: 'FileText' },
  ],
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export async function Sidebar() {
  const session = await auth()
  const role = (session?.user?.role ?? 'back_office') as UserRole
  const items = navItems[role] ?? navItems.back_office
  const fullName = session?.user?.fullName ?? 'Admin User'
  const initials = getInitials(fullName)

  return (
    <aside className="flex flex-col w-[260px] min-h-screen bg-[#112855] text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/10">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-bold text-white text-sm tracking-wide">SUNR Circle</p>
          <p className="text-[11px] text-blue-300">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <SidebarNavClient items={items} />
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#1a3d7c] text-xs font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{fullName}</p>
            <span className="inline-block text-[10px] bg-blue-700/60 text-blue-200 rounded px-1.5 py-0.5 mt-0.5">
              {getRoleLabel(role)}
            </span>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
