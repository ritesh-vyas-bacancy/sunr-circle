import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

import { requireRole } from '@/lib/auth/session'
import { getOffices } from '@/features/offices/queries/office.queries'
import { OfficesTable } from '@/features/offices/components/offices-table'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { SearchParams } from '@/types'

interface SubDivisionsPageProps {
  searchParams: Promise<SearchParams>
}

export const metadata = { title: 'Sub-Divisions' }

export default async function SubDivisionsPage({ searchParams }: SubDivisionsPageProps) {
  const session = await requireRole(['back_office', 'top_management'])
  const orgId = session.user.organizationId
  const params = await searchParams

  const search = typeof params.search === 'string' ? params.search : undefined
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page, 10)) : 1
  const pageSize = 20

  const result = await getOffices(orgId, { type: 'sub_division', search, page, pageSize })

  const canManage = session.user.role === 'back_office'

  return (
    <div className="p-6">
      <PageHeader title="Sub-Divisions" description="Manage sub-division offices under divisions.">
        {canManage && (
          <Button asChild>
            <Link href="/offices/sub-divisions/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Sub-Division
            </Link>
          </Button>
        )}
      </PageHeader>

      <OfficesTable
        data={result.data}
        type="sub_division"
        showParentColumn={true}
        totalCount={result.count}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        initialSearch={search ?? ''}
        canManage={canManage}
      />
    </div>
  )
}
