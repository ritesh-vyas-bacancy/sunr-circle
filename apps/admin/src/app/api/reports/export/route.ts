import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { generateExcelReport } from '@/features/reports/services/excel-export.service'
import { generatePDFReport } from '@/features/reports/services/pdf-export.service'
import type { ReportData } from '@/features/reports/queries/report.queries'

export async function POST(request: NextRequest) {
  try {
    await requireRole(['back_office', 'top_management'])
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { format: 'excel' | 'pdf'; data: ReportData }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { format, data } = body

  if (!data || !data.summary || !data.rows) {
    return NextResponse.json({ error: 'Invalid report data' }, { status: 400 })
  }

  if (format === 'excel') {
    const buffer = await generateExcelReport(data)
    const filename = `sunr-report-${data.filters.dateFrom}-to-${data.filters.dateTo}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  if (format === 'pdf') {
    const blob = await generatePDFReport(data)
    const arrayBuf = await blob.arrayBuffer()
    const filename = `sunr-report-${data.filters.dateFrom}-to-${data.filters.dateTo}.pdf`

    return new NextResponse(new Uint8Array(arrayBuf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.json({ error: 'Invalid format. Use excel or pdf.' }, { status: 400 })
}
