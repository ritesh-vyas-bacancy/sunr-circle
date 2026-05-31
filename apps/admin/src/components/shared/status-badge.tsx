import type { ComplaintStatus } from '@/types'

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  assigned: { label: 'Assigned', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  in_progress: {
    label: 'In Progress',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  closed: { label: 'Closed', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ' +
        config.className
      }
    >
      {config.label}
    </span>
  )
}
