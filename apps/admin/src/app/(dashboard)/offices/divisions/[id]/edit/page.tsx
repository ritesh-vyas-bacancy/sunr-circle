import { notFound } from 'next/navigation'

import { requireRole } from '@/lib/auth/session'
import { getOfficeById, getOfficesForSelect } from '@/features/offices/queries/office.queries'
import { OfficeForm } from '@/features/offices/components/office-form'
import { PageHeader } from '@/components/shared/page-header'

interface EditDivisionPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditDivisionPageProps) {
  const { id } = await params
  const office = await getOfficeById(id)
  return { title: office ? `Edit Division: ${office.name}` : 'Edit Division' }
}

export default async function EditDivisionPage({ params }: EditDivisionPageProps) {
  const session = await requireRole(['back_office'])
  const orgId = session.user.organizationId
  const { id } = await params

  const [office, circleOptions] = await Promise.all([
    getOfficeById(id),
    getOfficesForSelect(orgId, 'circle'),
  ])

  if (!office || office.office_type !== 'division') notFound()

  return (
    <div className="p-6">
      <PageHeader
        title={`Edit Division: ${office.name}`}
        backHref="/offices/divisions"
        backLabel="Back to Divisions"
      />
      <OfficeForm type="division" office={office} parentOptions={circleOptions} />
    </div>
  )
}
