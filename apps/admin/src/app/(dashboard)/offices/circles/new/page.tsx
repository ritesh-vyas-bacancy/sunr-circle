import { requireRole } from '@/lib/auth/session'
import { OfficeForm } from '@/features/offices/components/office-form'
import { PageHeader } from '@/components/shared/page-header'

export const metadata = { title: 'Add New Circle' }

export default async function NewCirclePage() {
  await requireRole(['back_office'])

  return (
    <div className="p-6">
      <PageHeader
        title="Add New Circle"
        backHref="/offices/circles"
        backLabel="Back to Circles"
      />
      <OfficeForm type="circle" />
    </div>
  )
}
