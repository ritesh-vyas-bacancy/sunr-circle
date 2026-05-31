'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  FileText,
  BarChart3,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  FileText,
  BarChart3,
}

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

interface SidebarNavClientProps {
  items: NavItem[]
}

export function SidebarNavClient({ items }: SidebarNavClientProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Auto-open group if a child is active
    const initial: Record<string, boolean> = {}
    items.forEach((item) => {
      if (item.children) {
        const anyActive = item.children.some((c) => pathname.startsWith(c.href))
        if (anyActive) initial[item.label] = true
      }
    })
    return initial
  })

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = iconMap[item.icon] ?? LayoutDashboard

        if (item.children) {
          const isOpen = openGroups[item.label] ?? false
          const anyChildActive = item.children.some((c) => pathname.startsWith(c.href))

          return (
            <li key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={cn(
                  'flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  anyChildActive
                    ? 'bg-[#1a3d7c] text-white'
                    : 'text-blue-100 hover:bg-[#1a3d7c] hover:text-white'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {isOpen && (
                <ul className="mt-0.5 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                  {item.children.map((child) => {
                    const isActive = pathname.startsWith(child.href)
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            'block rounded-md px-3 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-[#1a3d7c] text-white font-medium'
                              : 'text-blue-200 hover:bg-[#1a3d7c] hover:text-white'
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        }

        const isActive = item.href
          ? item.href === '/dashboard'
            ? pathname === item.href
            : pathname.startsWith(item.href)
          : false

        return (
          <li key={item.label}>
            <Link
              href={item.href ?? '#'}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#1a3d7c] text-white'
                  : 'text-blue-100 hover:bg-[#1a3d7c] hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
