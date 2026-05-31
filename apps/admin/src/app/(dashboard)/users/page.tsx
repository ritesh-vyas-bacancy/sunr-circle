import type { Metadata } from 'next'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

import { requireRole } from '@/lib/auth/session'
import { getUsers } from '@/features/users/queries/user.queries'
import { UsersTable } from '@/features/users/components/users-table'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'User Management' }

interface UsersPageProps {
  searchParams: Promise<{
    role?: string
    search?: string
    page?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await requireRole(['back_office', 'top_management'])
  const orgId = session.user.organizationId
  const params = await searchParams

  const role = params.role as UserRole | undefined
  const search = params.search
  const page = params.page ? parseInt(params.page, 10) : 1

  const result = await getUsers(orgId, {
    role,
    search,
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: 20,
    includeInactive: true,
  })

  const isBackOffice = session.user.role === 'back_office'

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <PageHeader
        title="User Management"
        description="Manage staff accounts and access roles across all sub divisions."
        actions={
          isBackOffice ? (
            <Button asChild>
              <Link href="/users/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          ) : undefined
        }
      />

      <UsersTable result={result} canManage={isBackOffice} />
    </div>
  )
}