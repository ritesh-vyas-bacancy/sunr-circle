import type { ReportData } from '../queries/report.queries'

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  closed: 'Closed',
  rejected: 'Rejected',
}

function fmt(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function fmtDT(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  )
}

export async function generatePDFReport(data: ReportData): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const PRIMARY_R = 26
  const PRIMARY_G = 61
  const PRIMARY_B = 124

  // ── Header banner ──────────────────────────────────────────────────────────
  doc.setFillColor(PRIMARY_R, PRIMARY_G, PRIMARY_B)
  doc.rect(0, 0, pageW, 20, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(data.organizationName, 10, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Complaint Management System — Report', pageW - 10, 13, { align: 'right' })

  // ── Report meta ────────────────────────────────────────────────────────────
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Complaint Report', 10, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    `Period: ${data.filters.dateFrom}  to  ${data.filters.dateTo}     |     Generated: ${fmtDT(data.generatedAt)}`,
    10,
    34,
  )

  // ── Summary boxes ──────────────────────────────────────────────────────────
  const boxes = [
    { label: 'Total', value: data.summary.total, color: [PRIMARY_R, PRIMARY_G, PRIMARY_B] as [number,number,number] },
    { label: 'Open', value: data.summary.open, color: [37, 99, 235] as [number,number,number] },
    { label: 'Assigned', value: data.summary.assigned, color: [217, 119, 6] as [number,number,number] },
    { label: 'In Progress', value: data.summary.in_progress, color: [234, 88, 12] as [number,number,number] },
    { label: 'Closed', value: data.summary.closed, color: [22, 163, 74] as [number,number,number] },
    { label: 'Rejected', value: data.summary.rejected, color: [220, 38, 38] as [number,number,number] },
    { label: 'SLA Breached', value: data.summary.sla_breached, color: [109, 40, 217] as [number,number,number] },
  ]

  const boxW = (pageW - 20) / boxes.length
  const boxY = 40

  boxes.forEach((box, i) => {
    const x = 10 + i * boxW
    doc.setFillColor(...box.color)
    doc.roundedRect(x, boxY, boxW - 2, 18, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(String(box.value), x + (boxW - 2) / 2, boxY + 10, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(box.label, x + (boxW - 2) / 2, boxY + 15, { align: 'center' })
  })

  // ── Complaint table ────────────────────────────────────────────────────────
  const tableY = boxY + 22

  autoTable(doc, {
    startY: tableY,
    head: [
      [
        'Complaint #',
        'Consumer Name',
        'Mobile',
        'Nature',
        'Status',
        'Sub Division',
        'Assigned To',
        'Created At',
        'Closed At',
      ],
    ],
    body: data.rows.map((r) => [
      r.complaint_number ?? r.raw_complaint_number,
      r.consumer_name,
      r.consumer_mobile,
      r.nature_of_complaint.length > 35
        ? r.nature_of_complaint.substring(0, 35) + '...'
        : r.nature_of_complaint,
      STATUS_LABELS[r.status] ?? r.status,
      r.sub_division_name,
      r.assigned_to_name ?? '—',
      fmt(r.created_at),
      fmt(r.closed_at),
    ]),
    headStyles: {
      fillColor: [PRIMARY_R, PRIMARY_G, PRIMARY_B],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    columnStyles: {
      0: { cellWidth: 28, font: 'courier' },
      1: { cellWidth: 32 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 50 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30 },
      6: { cellWidth: 28 },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' },
    },
    didDrawPage: (hookData) => {
      // Footer on every page
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Page ${hookData.pageNumber} of ${doc.internal.pages.length - 1}  |  SUNR Circle Complaint Management System`,
        pageW / 2,
        pageH - 5,
        { align: 'center' },
      )
    },
    margin: { top: tableY, left: 10, right: 10 },
  })

  const pdfOutput = doc.output('arraybuffer')
  return new Blob([pdfOutput], { type: 'application/pdf' })
}
