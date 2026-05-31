import type { Complaint, ComplaintStatus, UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { getRoleLabel, formatDateTime } from '@/lib/utils'

type SubDivisionParentParent = {
  id: string
  name: string
  code: string
} | null

type SubDivisionParent = {
  id: string
  name: string
  code: string
  parent: SubDivisionParentParent
} | null

type SubDivision = {
  id: string
  name: string
  code: string
  parent: SubDivisionParent
} | null

export interface ComplaintDetail extends Complaint {
  sub_division: SubDivision
  created_by_user: {
    id: string
    full_name: string
    role: UserRole
  } | null
  assigned_to_user: {
    id: string
    full_name: string
    mobile_number: string | null
  } | null
  logs: unknown[]
}

interface LabeledValueProps {
  label: string
  children: React.ReactNode
}

function LabeledValue({ label, children }: LabeledValueProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}

interface ComplaintDetailCardProps {
  complaint: ComplaintDetail
}

export function ComplaintDetailCard({ complaint }: ComplaintDetailCardProps) {
  const circle = complaint.sub_division?.parent?.parent?.name ?? '—'
  const division = complaint.sub_division?.parent?.name ?? '—'
  const subDivision = complaint.sub_division?.name ?? '—'

  return (
    <div className="space-y-4">
      {/* Card 1: Complaint Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Complaint Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top row: Complaint Number + Status Badge */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xl font-bold text-primary">
              {complaint.complaint_number ?? complaint.raw_complaint_number}
            </span>
            <StatusBadge status={complaint.status as ComplaintStatus} />
          </div>

          {/* Consumer Name + Mobile */}
          <div className="grid grid-cols-2 gap-4">
            <LabeledValue label="Consumer Name">{complaint.consumer_name}</LabeledValue>
            <LabeledValue label="Consumer Mobile">{complaint.consumer_mobile}</LabeledValue>
          </div>

          {/* Nature of Complaint */}
          <LabeledValue label="Nature of Complaint">
            {complaint.nature_of_complaint}
          </LabeledValue>

          {/* Complaint Remarks — only shown if present */}
          {complaint.complaint_remarks && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Complaint Remarks
              </p>
              <p className="rounded bg-muted p-3 text-sm italic text-muted-foreground">
                {complaint.complaint_remarks}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Location & Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Location &amp; Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Location */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <LabeledValue label="Circle">{circle}</LabeledValue>
              <LabeledValue label="Division">{division}</LabeledValue>
              <LabeledValue label="Sub Division">{subDivision}</LabeledValue>
            </div>

            {/* Assignment */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Assignment
              </p>
              <LabeledValue label="Created By">
                {complaint.created_by_user ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {complaint.created_by_user.full_name}
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {getRoleLabel(complaint.created_by_user.role)}
                    </span>
                  </span>
                ) : (
                  '—'
                )}
              </LabeledValue>
              <LabeledValue label="Assigned To">
                {complaint.assigned_to_user ? (
                  <span>
                    {complaint.assigned_to_user.full_name}
                    {complaint.assigned_to_user.mobile_number && (
                      <span className="ml-1 text-muted-foreground">
                        · {complaint.assigned_to_user.mobile_number}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="italic text-muted-foreground">Not Assigned</span>
                )}
              </LabeledValue>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Timestamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <LabeledValue label="Created">{formatDateTime(complaint.created_at)}</LabeledValue>
            <LabeledValue label="Assigned">{formatDateTime(complaint.assigned_at)}</LabeledValue>
            <LabeledValue label="In Progress">
              {formatDateTime(complaint.in_progress_at)}
            </LabeledValue>
            <LabeledValue label="Closed">{formatDateTime(complaint.closed_at)}</LabeledValue>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
