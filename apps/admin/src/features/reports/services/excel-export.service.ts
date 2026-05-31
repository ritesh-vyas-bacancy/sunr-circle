import type { ReportData, ReportRow } from '../queries/report.queries'

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  closed: 'Closed',
  rejected: 'Rejected',
}

function fmt(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export async function generateExcelReport(data: ReportData): Promise<Buffer> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SUNR Circle Admin'
  workbook.created = new Date()

  const PRIMARY = { argb: 'FF1a3d7c' }
  const WHITE   = { argb: 'FFFFFFFF' }
  const ALT_ROW = { argb: 'FFF0F4FF' }
  const BORDER_COLOR = { argb: 'FFE2E8F0' }

  const thin = { style: 'thin' as const, color: BORDER_COLOR }
  const allBorders = { top: thin, left: thin, bottom: thin, right: thin }

  // ──────────────────────────────────────────
  // Sheet 1: Summary
  // ──────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.properties.defaultColWidth = 30

  // Title row
  summarySheet.mergeCells('A1:D1')
  const titleCell = summarySheet.getCell('A1')
  titleCell.value = data.organizationName + ' — Complaint Report'
  titleCell.font = { bold: true, size: 16, color: WHITE }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: PRIMARY }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  summarySheet.getRow(1).height = 36

  // Sub-title
  summarySheet.mergeCells('A2:D2')
  const subtitleCell = summarySheet.getCell('A2')
  subtitleCell.value =
    `Period: ${data.filters.dateFrom} to ${data.filters.dateTo}   |   Generated: ${fmt(data.generatedAt)}`
  subtitleCell.font = { italic: true, size: 10, color: { argb: 'FF6B7280' } }
  subtitleCell.alignment = { horizontal: 'center' }

  summarySheet.addRow([])

  // Summary header
  const summaryHeaderRow = summarySheet.addRow(['Metric', 'Count'])
  summaryHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: WHITE }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: PRIMARY }
    cell.border = allBorders
    cell.alignment = { horizontal: 'center' }
  })

  const summaryItems = [
    ['Total Complaints', data.summary.total],
    ['Open', data.summary.open],
    ['Assigned', data.summary.assigned],
    ['In Progress', data.summary.in_progress],
    ['Closed', data.summary.closed],
    ['Rejected', data.summary.rejected],
    ['SLA Breached (>24h)', data.summary.sla_breached],
  ]

  summaryItems.forEach(([label, count], i) => {
    const row = summarySheet.addRow([label, count])
    row.eachCell((cell) => {
      cell.border = allBorders
      if (i % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: ALT_ROW }
      }
    })
    row.getCell(2).alignment = { horizontal: 'center' }
    row.getCell(2).font = { bold: true }
  })

  summarySheet.getColumn(1).width = 30
  summarySheet.getColumn(2).width = 16

  // ──────────────────────────────────────────
  // Sheet 2: Complaint Details
  // ──────────────────────────────────────────
  const detailSheet = workbook.addWorksheet('Complaint Details')

  const headers = [
    'Complaint #',
    'Consumer Name',
    'Consumer Mobile',
    'Nature of Complaint',
    'Status',
    'Circle',
    'Division',
    'Sub Division',
    'Created By',
    'Assigned To',
    'Attend Remarks',
    'Created At',
    'Assigned At',
    'In Progress At',
    'Closed At',
  ]

  const colWidths = [20, 22, 16, 40, 14, 22, 22, 22, 20, 20, 30, 20, 20, 20, 20]

  const headerRow = detailSheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: WHITE }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: PRIMARY }
    cell.border = allBorders
    cell.alignment = { horizontal: 'center', wrapText: true }
  })
  headerRow.height = 28
  detailSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  data.rows.forEach((row: ReportRow, i: number) => {
    const values = [
      row.complaint_number ?? row.raw_complaint_number,
      row.consumer_name,
      row.consumer_mobile,
      row.nature_of_complaint,
      STATUS_LABELS[row.status] ?? row.status,
      row.circle_name,
      row.division_name,
      row.sub_division_name,
      row.created_by_name,
      row.assigned_to_name ?? '—',
      row.attend_remarks ?? '—',
      fmt(row.created_at),
      fmt(row.assigned_at),
      fmt(row.in_progress_at),
      fmt(row.closed_at),
    ]

    const dataRow = detailSheet.addRow(values)
    dataRow.eachCell((cell) => {
      cell.border = allBorders
      cell.alignment = { wrapText: false, vertical: 'middle' }
      if (i % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: ALT_ROW }
      }
    })
  })

  colWidths.forEach((w, idx) => {
    detailSheet.getColumn(idx + 1).width = w
  })

  // Auto-filter on header row
  detailSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
