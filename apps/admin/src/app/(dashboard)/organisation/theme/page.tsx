import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getOrganisation } from '@/features/organisation/queries/organisation.queries'
import { ThemeForm } from '@/features/organisation/components/theme-form'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Organisation Theme' }

export default async function OrganisationThemePage() {
  await requireRole(['back_office'])
  const organisation = await getOrganisation()

  if (!organisation) notFound()

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <PageHeader
        title="Organisation Theme"
        description="Customise your organisation's primary and secondary brand colours."
        backHref="/organisation"
        backLabel="Back to Organisation Settings"
      />
      <ThemeForm organisation={organisation} readOnly={false} />
    </div>
  )
}
