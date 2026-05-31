import { requireRole } from '@/lib/auth/session'
import { getOfficesForSelect } from '@/features/offices/queries/office.queries'
import { OfficeForm } from '@/features/offices/components/office-form'
import { PageHeader } from '@/components/shared/page-header'

export const metadata = { title: 'Add New Sub-Division' }

export default async function NewSubDivisionPage() {
  const session = await requireRole(['back_office'])
  const orgId = session.user.organizationId

  const divisionOptions = await getOfficesForSelect(orgId, 'division')

  return (
    <div className="p-6">
      <PageHeader
        title="Add New Sub-Division"
        backHref="/offices/sub-divisions"
        backLabel="Back to Sub-Divisions"
      />
      <OfficeForm type="sub_division" parentOptions={divisionOptions} />
    </div>
  )
}
