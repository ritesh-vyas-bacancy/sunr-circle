import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { requireRole } from '@/lib/auth/session'
import { getSubDivisionsForSelect } from '@/features/users/queries/user.queries'
import { PageHeader } from '@/components/shared/page-header'
import { UserFormClient } from './user-form-client'

export const metadata: Metadata = { title: 'Add New User' }

export default async function NewUserPage() {
  const session = await requireRole(['back_office'])
  const orgId = session.user.organizationId

  const subDivisionOptions = await getSubDivisionsForSelect(orgId)

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <PageHeader
        title="Add New User"
        description="Create a new staff account. The user will be able to log in immediately."
        backHref="/users"
        backLabel="Back to Users"
      />

      <UserFormClient subDivisionOptions={subDivisionOptions} />
    </div>
  )
}