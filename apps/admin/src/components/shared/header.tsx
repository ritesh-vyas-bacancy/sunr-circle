'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { logoutAction } from '@/features/auth/actions/auth.actions'

interface HeaderProps {
  fullName?: string
  email?: string
  role?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    back_office: 'Back Office',
    top_management: 'Top Management',
    call_centre: 'Call Centre',
    line_man: 'Line Man',
  }
  return labels[role] ?? role
}

export function Header({ fullName = '', email = '', role = '' }: HeaderProps) {
  const initials = fullName ? getInitials(fullName) : 'AU'

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-gray-700 hidden sm:block">
          SUNR Circle Admin
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
          <Bell className="h-5 w-5 text-gray-600" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#1a3d7c] text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {fullName || 'Admin'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{fullName || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
                {role && (
                  <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction} className="w-full">
                <button type="submit" className="w-full text-left text-sm text-red-600">
                  Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
