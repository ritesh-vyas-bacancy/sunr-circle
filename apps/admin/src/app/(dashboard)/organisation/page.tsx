import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getOrganisation } from '@/features/organisation/queries/organisation.queries'
import { OrganisationForm } from '@/features/organisation/components/organisation-form'
import { LogoUpload } from '@/features/organisation/components/logo-upload'
import { ThemeForm } from '@/features/organisation/components/theme-form'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = { title: 'Organisation Settings' }

export default async function OrganisationPage() {
  const session = await requireRole(['back_office', 'top_management'])
  const organisation = await getOrganisation()

  if (!organisation) notFound()

  const isReadOnly = session.user.role === 'top_management'

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <PageHeader
        title="Organisation Settings"
        description="Manage your organisation profile, logo, and brand theme."
      />

      <Tabs defaultValue="general">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <OrganisationForm organisation={organisation} readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="logo">
          <LogoUpload currentLogoUrl={organisation.logo_url} readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="theme">
          <ThemeForm organisation={organisation} readOnly={isReadOnly} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
