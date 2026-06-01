import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { generateReport } from '@/features/reports/queries/report.queries'
import type { ReportFilters } from '@/features/reports/queries/report.queries'

export async function POST(request: NextRequest) {
  // Auth check
  let session
  try {
    session = await requireRole(['back_office', 'top_management'])
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { filters: ReportFilters }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const data = await generateReport(session.user.organizationId, body.filters)
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Report generation failed' },
      { status: 500 }
    )
  }
}
