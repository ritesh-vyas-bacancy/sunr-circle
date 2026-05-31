import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { ReportBuilder } from '@/features/reports/components/report-builder'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const session = await requireRole(['back_office', 'top_management'])
  const orgId = session.user.organizationId
  const supabase = createAdminClient()

  // Fetch filter options in parallel
  const [{ data: offices }, { data: lineMen }] = await Promise.all([
    supabase
      .from('offices')
      .select('id, name, code, office_type, parent_id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('code'),
    supabase
      .from('users')
      .select('id, full_name')
      .eq('organization_id', orgId)
      .eq('role', 'line_man')
      .eq('is_active', true)
      .order('full_name'),
  ])

  const circles = (offices ?? []).filter((o: any) => o.office_type === 'circle')
  const divisionsList = (offices ?? []).filter((o: any) => o.office_type === 'division')
  const subDivisionsList = (offices ?? []).filter((o: any) => o.office_type === 'sub_division')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and export complaint reports by date range and office filters"
      />
      <ReportBuilder
        circles={circles as any}
        divisions={divisionsList as any}
        subDivisions={subDivisionsList as any}
        lineMen={(lineMen ?? []) as any}
      />
    </div>
  )
}
