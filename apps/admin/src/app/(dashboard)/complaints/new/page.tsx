import type { Metadata } from 'next'
import Link from 'next/link'

import { getOfficesForComplaintForm } from '@/features/complaints/queries/complaint.queries'
import { CreateComplaintForm } from '@/features/complaints/components/create-complaint-form'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'New Complaint' }

export default async function NewComplaintPage() {
  const session = await requireRole(['back_office'])
  const orgId = session.user.organizationId

  const allOffices = await getOfficesForComplaintForm(orgId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Complaint"
        actions={
          <Button variant="outline" asChild>
            <Link href="/complaints">← Back to Complaints</Link>
          </Button>
        }
      />

      <CreateComplaintForm allOffices={allOffices} />
    </div>
  )
}
