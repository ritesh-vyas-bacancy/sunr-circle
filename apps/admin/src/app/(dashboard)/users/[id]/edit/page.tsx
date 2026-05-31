import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { requireRole } from '@/lib/auth/session'
import {
  getUserById,
  getSubDivisionsForSelect,
} from '@/features/users/queries/user.queries'
import { PageHeader } from '@/components/shared/page-header'
import { EditUserFormClient } from './edit-user-form-client'

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditUserPageProps): Promise<Metadata> {
  const { id } = await params
  const user = await getUserById(id)
  return { title: user ? `Edit User: ${user.full_name}` : 'Edit User' }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await requireRole(['back_office'])
  const orgId = session.user.organizationId
  const { id } = await params

  const [user, subDivisionOptions] = await Promise.all([
    getUserById(id),
    getSubDivisionsForSelect(orgId),
  ])

  if (!user) notFound()

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <PageHeader
        title={`Edit User: ${user.full_name}`}
        description="Update this user's profile details and role."
        backHref="/users"
        backLabel="Back to Users"
      />

      <EditUserFormClient user={user} subDivisionOptions={subDivisionOptions} />
    </div>
  )
}
