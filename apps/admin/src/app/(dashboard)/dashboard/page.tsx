import type { Metadata } from 'next'
import { FileText, Clock, UserCheck, Wrench, CheckCircle2 } from 'lucide-react'
import { requireSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDateTime } from '@/lib/utils'
import type { ComplaintStatus } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard | SUNR Circle Admin',
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  accentClass: string
}

function StatCard({ label, value, icon, accentClass }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-5">
          <div className={`flex items-center justify-center h-12 w-12 rounded-lg shrink-0 ${accentClass}`}>
            {icon}
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RecentComplaint {
  id: string
  raw_complaint_number: string
  consumer_name: string
  nature_of_complaint: string
  status: ComplaintStatus
  sub_division_name: string | null
  created_at: string
}

export default async function DashboardPage() {
  const session = await requireSession()
  const supabase = createAdminClient()
  const orgId = session.user.organizationId

  // Fetch counts in parallel
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const [
    { count: totalCount },
    { count: openCount },
    { count: assignedCount },
    { count: inProgressCount },
    { count: closedTodayCount },
    { data: rawComplaints },
  ] = await Promise.all([
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'open'),
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'assigned'),
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'in_progress'),
    supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'closed')
      .gte('closed_at', todayIso),
    supabase
      .from('complaints')
      .select('id, raw_complaint_number, consumer_name, nature_of_complaint, status, created_at, sub_division_id')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Collect unique sub_division_ids and resolve their names in one query
  const subDivisionIds = [
    ...new Set((rawComplaints ?? []).map((c) => c.sub_division_id).filter(Boolean)),
  ] as string[]

  const { data: officeRows } =
    subDivisionIds.length > 0
      ? await supabase
          .from('offices')
          .select('id, name')
          .in('id', subDivisionIds)
      : { data: [] }

  const officeMap = new Map<string, string>(
    (officeRows ?? []).map((o) => [o.id, o.name])
  )

  const stats = [
    {
      label: 'Total Complaints',
      value: totalCount ?? 0,
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      accentClass: 'bg-blue-100',
    },
    {
      label: 'Open',
      value: openCount ?? 0,
      icon: <Clock className="h-6 w-6 text-sky-600" />,
      accentClass: 'bg-sky-100',
    },
    {
      label: 'Assigned',
      value: assignedCount ?? 0,
      icon: <UserCheck className="h-6 w-6 text-yellow-600" />,
      accentClass: 'bg-yellow-100',
    },
    {
      label: 'In Progress',
      value: inProgressCount ?? 0,
      icon: <Wrench className="h-6 w-6 text-orange-600" />,
      accentClass: 'bg-orange-100',
    },
    {
      label: 'Closed Today',
      value: closedTodayCount ?? 0,
      icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
      accentClass: 'bg-green-100',
    },
  ]

  const complaints: RecentComplaint[] = (rawComplaints ?? []).map((c) => ({
    id: c.id,
    raw_complaint_number: c.raw_complaint_number,
    consumer_name: c.consumer_name,
    nature_of_complaint: c.nature_of_complaint,
    status: c.status as ComplaintStatus,
    sub_division_name: c.sub_division_id ? (officeMap.get(c.sub_division_id) ?? null) : null,
    created_at: c.created_at,
  }))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of complaints and system activity"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent complaints */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            Recent Complaints
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 w-10">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Consumer Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Nature of Complaint
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Sub Division
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint, idx) => (
                    <tr
                      key={complaint.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-muted-foreground font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {complaint.consumer_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                        {complaint.nature_of_complaint}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {complaint.sub_division_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDateTime(complaint.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
