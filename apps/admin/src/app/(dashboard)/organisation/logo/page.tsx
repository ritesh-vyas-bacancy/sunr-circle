import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getOrganisation } from '@/features/organisation/queries/organisation.queries'
import { LogoUpload } from '@/features/organisation/components/logo-upload'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Organisation Logo' }

export default async function OrganisationLogoPage() {
  await requireRole(['back_office'])
  const organisation = await getOrganisation()

  if (!organisation) notFound()

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <PageHeader
        title="Organisation Logo"
        description="Upload or replace your organisation logo."
        backHref="/organisation"
        backLabel="Back to Organisation Settings"
      />
      <LogoUpload currentLogoUrl={organisation.logo_url} readOnly={false} />
    </div>
  )
}
