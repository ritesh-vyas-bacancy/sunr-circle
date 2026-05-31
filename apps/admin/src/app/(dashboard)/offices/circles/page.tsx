import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PlusCircle } from 'lucide-react'

import { requireRole } from '@/lib/auth/session'
import { getOffices } from '@/features/offices/queries/office.queries'
import { OfficesTable } from '@/features/offices/components/offices-table'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { SearchParams } from '@/types'

interface CirclesPageProps {
  searchParams: Promise<SearchParams>
}

export const metadata = { title: 'Circles' }

export default async function CirclesPage({ searchParams }: CirclesPageProps) {
  const session = await requireRole(['back_office', 'top_management'])
  const orgId = session.user.organizationId
  const params = await searchParams

  const search = typeof params.search === 'string' ? params.search : undefined
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page, 10)) : 1
  const pageSize = 20

  const result = await getOffices(orgId, { type: 'circle', search, page, pageSize })

  const canManage = session.user.role === 'back_office'

  return (
    <div className="p-6">
      <PageHeader title="Circles" description="Manage top-level circle offices.">
        {canManage && (
          <Button asChild>
            <Link href="/offices/circles/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Circle
            </Link>
          </Button>
        )}
      </PageHeader>

      <OfficesTable
        data={result.data}
        type="circle"
        showParentColumn={false}
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
