import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import type { ComplaintStatus, UserRole } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!date) return '—'
  try {
    return format(new Date(date), fmt)
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function getStatusVariant(
  status: ComplaintStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<ComplaintStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    open: 'default',
    assigned: 'secondary',
    in_progress: 'outline',
    closed: 'secondary',
    rejected: 'destructive',
  }
  return map[status]
}

export function getStatusLabel(status: ComplaintStatus): string {
  const map: Record<ComplaintStatus, string> = {
    open: 'Open',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    closed: 'Closed',
    rejected: 'Rejected',
  }
  return map[status]
}

export function getRoleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    back_office: 'Back Office',
    call_centre: 'Call Centre',
    line_man: 'Line Man',
    top_management: 'Top Management',
  }
  return map[role]
}

export function formatComplaintNumber(
  orgCode: string,
  subdivisionCode: string,
  rawNumber: string
): string {
  return orgCode + '-' + subdivisionCode + '-' + rawNumber
}

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
