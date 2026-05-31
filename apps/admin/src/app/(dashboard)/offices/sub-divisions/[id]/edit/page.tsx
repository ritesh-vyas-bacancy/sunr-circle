import { notFound } from 'next/navigation'

import { requireRole } from '@/lib/auth/session'
import { getOfficeById, getOfficesForSelect } from '@/features/offices/queries/office.queries'
import { OfficeForm } from '@/features/offices/components/office-form'
import { PageHeader } from '@/components/shared/page-header'

interface EditSubDivisionPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditSubDivisionPageProps) {
  const { id } = await params
  const office = await getOfficeById(id)
  return { title: office ? `Edit Sub-Division: ${office.name}` : 'Edit Sub-Division' }
}

export default async function EditSubDivisionPage({ params }: EditSubDivisionPageProps) {
  const session = await requireRole(['back_office'])
  const orgId = session.user.organizationId
  const { id } = await params

  const [office, divisionOptions] = await Promise.all([
    getOfficeById(id),
    getOfficesForSelect(orgId, 'division'),
  ])

  if (!office || office.office_type !== 'sub_division') notFound()

  return (
    <div className="p-6">
      <PageHeader
        title={`Edit Sub-Division: ${office.name}`}
        backHref="/offices/sub-divisions"
        backLabel="Back to Sub-Divisions"
      />
      <OfficeForm type="sub_division" office={office} parentOptions={divisionOptions} />
    </div>
  )
}
