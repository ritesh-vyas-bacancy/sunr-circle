import { requireRole } from '@/lib/auth/session'
import { getOfficesForSelect } from '@/features/offices/queries/office.queries'
import { OfficeForm } from '@/features/offices/components/office-form'
import { PageHeader } from '@/components/shared/page-header'

export const metadata = { title: 'Add New Division' }

export default async function NewDivisionPage() {
  const session = await requireRole(['back_office'])
  const orgId = session.user.organizationId

  const circleOptions = await getOfficesForSelect(orgId, 'circle')

  return (
    <div className="p-6">
      <PageHeader
        title="Add New Division"
        backHref="/offices/divisions"
        backLabel="Back to Divisions"
      />
      <OfficeForm type="division" parentOptions={circleOptions} />
    </div>
  )
}
