import type { Metadata } from 'next'
import Link from 'next/link'

import { getComplaints, getComplaintFiltersData } from '@/features/complaints/queries/complaint.queries'
import { ComplaintFilters } from '@/features/complaints/components/complaint-filters'
import { ComplaintsTable } from '@/features/complaints/components/complaints-table'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/session'
import type { SearchParams, ComplaintStatus } from '@/types'

export const metadata: Metadata = { title: 'Complaints' }

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireRole(['back_office', 'top_management'])
  const orgId = session.user.organizationId
  const params = await searchParams

  const search = params.search as string | undefined
  const circleId = params.circleId as string | undefined
  const divisionId = params.divisionId as string | undefined
  const subDivisionId = params.subDivisionId as string | undefined
  const status = (params.status ? (params.status as ComplaintStatus) : undefined)
  const assignedTo = params.assignedTo as string | undefined
  const dateFrom = params.dateFrom as string | undefined
  const dateTo = params.dateTo as string | undefined
  const page = parseInt(params.page as string) || 1
  const pageSize = 20

  const [result, filterData] = await Promise.all([
    getComplaints(orgId, {
      search,
      circleId,
      divisionId,
      subDivisionId,
      status,
      assignedTo,
      dateFrom,
      dateTo,
      page,
      pageSize,
    }),
    getComplaintFiltersData(orgId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        subtitle={`${result.count} total complaints`}
        actions={
          session.user.role === 'back_office' ? (
            <Button asChild>
              <Link href="/complaints/new">+ New Complaint</Link>
            </Button>
          ) : null
        }
      />

      <ComplaintFilters
        circles={filterData.circles as any}
        divisions={filterData.divisions as any}
        subDivisions={filterData.subDivisions as any}
        lineMen={filterData.lineMen as any}
        currentFilters={{
          search,
          circleId,
          divisionId,
          subDivisionId,
          status,
          assignedTo,
          dateFrom,
          dateTo,
        }}
      />

      <ComplaintsTable
        data={result.data as any}
        totalCount={result.count}
        page={result.page}
        pageSize={result.pageSize}
        isBackOffice={session.user.role === 'back_office'}
      />
    </div>
  )
}
