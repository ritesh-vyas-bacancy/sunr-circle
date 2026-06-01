'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  AreaChart, Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportData } from '../queries/report.queries'

// ─── Colour palette ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  open:        '#2563eb',
  assigned:    '#d97706',
  in_progress: '#ea580c',
  closed:      '#16a34a',
  rejected:    '#dc2626',
}
const PALETTE = ['#1a3d7c', '#2563eb', '#d97706', '#ea580c', '#16a34a', '#dc2626', '#7c3aed']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function groupByDay(rows: ReportData['rows']) {
  const map = new Map<string, number>()
  rows.forEach((r) => {
    const day = r.created_at.substring(0, 10)
    map.set(day, (map.get(day) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: fmtDate(date), count }))
}

function groupBySubDivision(rows: ReportData['rows']) {
  const map = new Map<string, number>()
  rows.forEach((r) => {
    const key = r.sub_division_name || 'Unknown'
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name: name.length > 16 ? name.slice(0, 15) + '…' : name, count }))
}

function groupByNature(rows: ReportData['rows']) {
  const map = new Map<string, number>()
  rows.forEach((r) => {
    const key = r.nature_of_complaint.length > 30
      ? r.nature_of_complaint.slice(0, 30) + '…'
      : r.nature_of_complaint
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))
}

// ─── Reusable chart card ──────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey || p.name} style={{ color: p.fill || p.stroke || '#1a3d7c' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function ReportCharts({ data }: { data: ReportData }) {
  const { summary, rows } = data

  // Pie / donut data
  const statusPieData = [
    { name: 'Open', value: summary.open, color: STATUS_COLORS.open },
    { name: 'Assigned', value: summary.assigned, color: STATUS_COLORS.assigned },
    { name: 'In Progress', value: summary.in_progress, color: STATUS_COLORS.in_progress },
    { name: 'Closed', value: summary.closed, color: STATUS_COLORS.closed },
    { name: 'Rejected', value: summary.rejected, color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0)

  // Bar data: status breakdown
  const statusBarData = [
    { name: 'Open', count: summary.open, fill: STATUS_COLORS.open },
    { name: 'Assigned', count: summary.assigned, fill: STATUS_COLORS.assigned },
    { name: 'In Progress', count: summary.in_progress, fill: STATUS_COLORS.in_progress },
    { name: 'Closed', count: summary.closed, fill: STATUS_COLORS.closed },
    { name: 'Rejected', count: summary.rejected, fill: STATUS_COLORS.rejected },
  ]

  const dailyData = groupByDay(rows)
  const subDivData = groupBySubDivision(rows)
  const natureData = groupByNature(rows)

  if (summary.total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No complaints in the selected date range. Adjust the filters and generate again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Pie + Bar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Pie chart — status distribution */}
        <ChartCard title="Status Distribution (Pie Chart)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="45%"
                outerRadius={100}
                innerRadius={55}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusPieData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Bar chart — status counts */}
        <ChartCard title="Complaints by Status (Bar Chart)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                {statusBarData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Daily trend */}
      {dailyData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Line chart — complaints over time */}
          <ChartCard title="Complaints Trend Over Time (Line Chart)">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Complaints"
                  stroke="#1a3d7c"
                  strokeWidth={2}
                  dot={{ fill: '#1a3d7c', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 4. Area chart — cumulative / filled trend */}
          <ChartCard title="Complaints Volume Over Time (Area Chart)">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3d7c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1a3d7c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Complaints"
                  stroke="#1a3d7c"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Row 3: Sub Division + Nature of Complaint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 5. Horizontal bar — top sub-divisions */}
        {subDivData.length > 0 && (
          <ChartCard title="Complaints by Sub Division (Bar Chart)">
            <ResponsiveContainer width="100%" height={Math.max(200, subDivData.length * 36)}>
              <BarChart
                data={subDivData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Complaints" fill="#1a3d7c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* 6. Nature of complaint bar */}
        {natureData.length > 0 && (
          <ChartCard title="Top Nature of Complaints (Bar Chart)">
            <ResponsiveContainer width="100%" height={Math.max(200, natureData.length * 36)}>
              <BarChart
                data={natureData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Complaints" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Row 4: SLA summary bar */}
      {summary.sla_breached > 0 && (
        <ChartCard title="SLA Compliance">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={[
                { name: 'Within SLA', count: summary.closed - summary.sla_breached, fill: '#16a34a' },
                { name: 'SLA Breached (>24h)', count: summary.sla_breached, fill: '#dc2626' },
              ]}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                {[
                  { fill: '#16a34a' },
                  { fill: '#dc2626' },
                ].map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
