'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { FileSpreadsheet, FileText, BarChart3, Loader2, TableIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { ReportData, ReportFilters } from '../queries/report.queries'
import { ReportCharts } from './report-charts'
// NOTE: generateReport is called via /api/reports/generate (fetch) instead of
// a Server Action import. This avoids the 'use server' → next/headers chain
// being bundled into the client component in Next.js 16.

interface Office {
  id: string
  name: string
  code: string
  office_type: string
  parent_id: string | null
}

interface LinMan {
  id: string
  full_name: string
}

interface ReportBuilderProps {
  circles: Office[]
  divisions: Office[]
  subDivisions: Office[]
  lineMen: LinMan[]
  orgId: string
}

const REPORT_TYPES = [
  { value: 'daily', label: 'Daily Report' },
  { value: 'weekly', label: 'Weekly Report' },
  { value: 'monthly', label: 'Monthly Report' },
  { value: 'six_monthly', label: 'Six-Monthly Report' },
  { value: 'yearly', label: 'Yearly Report' },
  { value: 'custom', label: 'Custom Date Range' },
]

// Use 'all' sentinel instead of '' — Radix UI Select forbids empty string values
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
]

function getDefaultDates(type: string): { from: string; to: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const today = toISO(now)

  if (type === 'daily') {
    return { from: today, to: today }
  }
  if (type === 'weekly') {
    const from = new Date(now)
    from.setDate(now.getDate() - 6)
    return { from: toISO(from), to: today }
  }
  if (type === 'monthly') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toISO(from), to: today }
  }
  if (type === 'six_monthly') {
    const from = new Date(now)
    from.setMonth(now.getMonth() - 6)
    return { from: toISO(from), to: today }
  }
  if (type === 'yearly') {
    const from = new Date(now.getFullYear(), 0, 1)
    return { from: toISO(from), to: today }
  }
  return { from: today, to: today }
}

export function ReportBuilder({
  circles,
  divisions,
  subDivisions,
  lineMen,
  orgId,
}: ReportBuilderProps) {
  const [reportType, setReportType] =
    useState<ReportFilters['reportType']>('monthly')
  const [dateFrom, setDateFrom] = useState(getDefaultDates('monthly').from)
  const [dateTo, setDateTo] = useState(getDefaultDates('monthly').to)
  // Use 'all' sentinel — Radix UI Select forbids empty string values
  const [circleId, setCircleId] = useState('all')
  const [divisionId, setDivisionId] = useState('all')
  const [subDivisionId, setSubDivisionId] = useState('all')
  const [status, setStatus] = useState('all')
  const [assignedTo, setAssignedTo] = useState('all')

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isGenerating, startGenerating] = useTransition()
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null)

  const filteredDivisions = divisions.filter(
    (d) => circleId === 'all' || d.parent_id === circleId,
  )
  const filteredSubDivisions = subDivisions.filter(
    (s) => divisionId === 'all' || s.parent_id === divisionId,
  )

  function onReportTypeChange(val: string) {
    const t = val as ReportFilters['reportType']
    setReportType(t)
    if (t !== 'custom') {
      const dates = getDefaultDates(t)
      setDateFrom(dates.from)
      setDateTo(dates.to)
    }
  }

  function onCircleChange(val: string) {
    setCircleId(val)
    setDivisionId('all')
    setSubDivisionId('all')
  }

  function onDivisionChange(val: string) {
    setDivisionId(val)
    setSubDivisionId('all')
  }

  function handleGenerate() {
    startGenerating(async () => {
      try {
        // Convert 'all' sentinel back to undefined for the API
        const filters: ReportFilters = {
          reportType,
          dateFrom,
          dateTo,
          circleId: circleId !== 'all' ? circleId : undefined,
          divisionId: divisionId !== 'all' ? divisionId : undefined,
          subDivisionId: subDivisionId !== 'all' ? subDivisionId : undefined,
          status: status !== 'all' ? (status as any) : undefined,
          assignedTo: assignedTo !== 'all' ? assignedTo : undefined,
        }
        // Call Route Handler instead of Server Action to avoid
        // 'use server' → next/headers bundling issue in Next.js 16
        const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }))
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }
        const data: ReportData = await res.json()
        setReportData(data)
        toast.success(`Report generated — ${data.summary.total} complaints`)
      } catch (e: any) {
        toast.error(e.message ?? 'Failed to generate report')
      }
    })
  }

  async function handleExport(format: 'excel' | 'pdf') {
    if (!reportData) return
    setIsExporting(format)
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, data: reportData }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sunr-report-${reportData.filters.dateFrom}-to-${reportData.filters.dateTo}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} exported successfully`)
    } catch (e: any) {
      toast.error(e.message ?? 'Export failed')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Report type + dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={onReportTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={reportType !== 'custom'}
              />
            </div>
            <div className="space-y-1">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={reportType !== 'custom'}
              />
            </div>
          </div>

          {/* Row 2: Office filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Circle</Label>
              <Select value={circleId} onValueChange={onCircleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Circles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Circles</SelectItem>
                  {circles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Division</Label>
              <Select
                value={divisionId}
                onValueChange={onDivisionChange}
                disabled={!circleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {filteredDivisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sub Division</Label>
              <Select
                value={subDivisionId}
                onValueChange={setSubDivisionId}
                disabled={!divisionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sub Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Divisions</SelectItem>
                  {filteredSubDivisions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            {reportData && (
              <>
                <Separator orientation="vertical" className="h-8" />
                <Button
                  variant="outline"
                  onClick={() => handleExport('excel')}
                  disabled={!!isExporting}
                >
                  {isExporting === 'excel' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  disabled={!!isExporting}
                >
                  {isExporting === 'pdf' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results — tabbed: Charts view + Table view */}
      {reportData && (
        <div className="space-y-4">
          {/* Summary stat cards */}
          <ReportSummaryCards data={reportData} />

          {/* Tabs */}
          <Tabs defaultValue="charts">
            <TabsList className="grid grid-cols-2 w-[280px]">
              <TabsTrigger value="charts" className="gap-1.5">
                <BarChart3 className="h-4 w-4" /> Charts &amp; Graphs
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5">
                <TableIcon className="h-4 w-4" /> Table View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="mt-4">
              <ReportCharts data={reportData} />
            </TabsContent>

            <TabsContent value="table" className="mt-4">
              <ReportResults data={reportData} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

const SUMMARY_CONFIG = [
  { key: 'total', label: 'Total', color: 'bg-blue-900 text-white' },
  { key: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
  { key: 'assigned', label: 'Assigned', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
  { key: 'closed', label: 'Closed', color: 'bg-green-100 text-green-800' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { key: 'sla_breached', label: 'SLA Breached', color: 'bg-purple-100 text-purple-800' },
] as const

function ReportSummaryCards({ data }: { data: ReportData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {SUMMARY_CONFIG.map(({ key, label, color }) => (
        <div key={key} className={`rounded-lg p-3 text-center ${color}`}>
          <div className="text-2xl font-bold">
            {data.summary[key as keyof typeof data.summary]}
          </div>
          <div className="text-xs mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

function ReportResults({ data }: { data: ReportData }) {
  return (
    <div className="space-y-4">

      {/* Preview table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Complaint Details — {data.rows.length} records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['Complaint #', 'Consumer', 'Mobile', 'Nature', 'Status', 'Sub Division', 'Assigned To', 'Created'].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.rows.slice(0, 100).map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                    <td className="px-3 py-2 font-mono">{row.complaint_number ?? row.raw_complaint_number}</td>
                    <td className="px-3 py-2">{row.consumer_name}</td>
                    <td className="px-3 py-2">{row.consumer_mobile}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate" title={row.nature_of_complaint}>{row.nature_of_complaint}</td>
                    <td className="px-3 py-2 capitalize">{row.status.replace('_', ' ')}</td>
                    <td className="px-3 py-2">{row.sub_division_name}</td>
                    <td className="px-3 py-2">{row.assigned_to_name ?? '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.rows.length > 100 && (
              <p className="px-4 py-2 text-xs text-muted-foreground">
                Showing first 100 of {data.rows.length} records. Export to Excel/PDF for full data.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
