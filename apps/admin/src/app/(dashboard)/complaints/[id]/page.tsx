import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getComplaintById } from '@/features/complaints/queries/complaint.queries'
import { ComplaintDetailCard } from '@/features/complaints/components/complaint-detail-card'
import { ComplaintTimeline } from '@/features/complaints/components/complaint-timeline'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/session'
import { ComplaintActionsClient } from './complaint-actions-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const complaint = await getComplaintById(id)
  return {
    title: complaint
      ? (complaint.complaint_number ?? complaint.raw_complaint_number)
      : 'Complaint Not Found',
  }
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await requireRole(['back_office', 'top_management'])
  const complaint = await getComplaintById(id)

  if (!complaint) notFound()

  const isTerminal = complaint.status === 'closed' || complaint.status === 'rejected'

  return (
    <div className="space-y-6">
      <PageHeader
        title={complaint.complaint_number ?? complaint.raw_complaint_number}
        subtitle={`${complaint.consumer_name} · ${complaint.consumer_mobile}`}
        actions={
          <div className="flex gap-2 items-center">
            <StatusBadge status={complaint.status} />
            <Button variant="outline" asChild>
              <Link href="/complaints">← Back</Link>
            </Button>
            {session.user.role === 'back_office' && !isTerminal && (
              <ComplaintActionsClient complaint={complaint as any} />
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <ComplaintDetailCard complaint={complaint as any} />
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ComplaintTimeline logs={complaint.logs as any} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
