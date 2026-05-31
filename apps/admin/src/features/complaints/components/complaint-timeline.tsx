import { CheckCircle, UserCheck, Wrench, CheckCircle2, XCircle } from 'lucide-react'
import type { ComplaintStatus, UserRole } from '@/types'
import { getStatusLabel, getRoleLabel, formatDateTime } from '@/lib/utils'

interface TimelineLog {
  id: string
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus
  remarks: string | null
  changed_by_user: {
    full_name: string
    role: UserRole
  } | null
  logged_at: string
}

interface ComplaintTimelineProps {
  logs: TimelineLog[]
}

type StatusIconConfig = {
  icon: React.ElementType
  bg: string
  color: string
}

const statusIconMap: Record<ComplaintStatus, StatusIconConfig> = {
  open: { icon: CheckCircle, bg: 'bg-blue-100', color: 'text-blue-600' },
  assigned: { icon: UserCheck, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  in_progress: { icon: Wrench, bg: 'bg-orange-100', color: 'text-orange-600' },
  closed: { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
  rejected: { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
}

export function ComplaintTimeline({ logs }: ComplaintTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No activity recorded yet.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1
        const config = statusIconMap[log.new_status] ?? statusIconMap.open
        const Icon = config.icon

        const statusLine = log.old_status
          ? `Status changed: ${getStatusLabel(log.old_status)} → ${getStatusLabel(log.new_status)}`
          : 'Complaint Created'

        const changedByName = log.changed_by_user?.full_name ?? 'System'
        const changedByRole = log.changed_by_user?.role
          ? ` (${getRoleLabel(log.changed_by_user.role)})`
          : ''

        return (
          <div key={log.id} className="relative flex gap-3 pb-6">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
                aria-hidden="true"
              />
            )}

            {/* Status icon */}
            <div
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium">{statusLine}</p>
              {log.remarks && (
                <p className="mt-0.5 text-sm italic text-muted-foreground">{log.remarks}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                by {changedByName}
                {changedByRole} &middot; {formatDateTime(log.logged_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
