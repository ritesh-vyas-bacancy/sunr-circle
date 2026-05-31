import { notFound } from 'next/navigation'

import { requireRole } from '@/lib/auth/session'
import { getOfficeById } from '@/features/offices/queries/office.queries'
import { OfficeForm } from '@/features/offices/components/office-form'
import { PageHeader } from '@/components/shared/page-header'

interface EditCirclePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditCirclePageProps) {
  const { id } = await params
  const office = await getOfficeById(id)
  return { title: office ? `Edit Circle: ${office.name}` : 'Edit Circle' }
}

export default async function EditCirclePage({ params }: EditCirclePageProps) {
  await requireRole(['back_office'])
  const { id } = await params

  const office = await getOfficeById(id)
  if (!office || office.office_type !== 'circle') notFound()

  return (
    <div className="p-6">
      <PageHeader
        title={`Edit Circle: ${office.name}`}
        backHref="/offices/circles"
        backLabel="Back to Circles"
      />
      <OfficeForm type="circle" office={office} />
    </div>
  )
}
