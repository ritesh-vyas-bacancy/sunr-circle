'use client'

import { useState } from 'react'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import Link from 'next/link'
import { Eye, MoreHorizontal, RefreshCw, UserCheck } from 'lucide-react'

import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUrlParams } from '@/hooks/use-url-params'
import { formatDate } from '@/lib/utils'
import type { Complaint } from '@/types'

import { AssignComplaintDialog } from './assign-complaint-dialog'
import { UpdateStatusDialog } from './update-status-dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplaintListItem = Complaint & {
  sub_division: { id: string; name: string; code: string } | null
  created_by_user: { id: string; full_name: string } | null
  assigned_to_user: { id: string; full_name: string } | null
}

interface ComplaintsTableProps {
  data: ComplaintListItem[]
  totalCount: number
  page: number
  pageSize: number
  isBackOffice: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComplaintsTable({
  data,
  totalCount,
  page,
  pageSize,
  isBackOffice,
}: ComplaintsTableProps) {
  const { setParam } = useUrlParams()

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintListItem | null>(null)
  const [dialogType, setDialogType] = useState<'assign' | 'status' | null>(null)

  function openDialog(complaint: ComplaintListItem, type: 'assign' | 'status') {
    setSelectedComplaint(complaint)
    setDialogType(type)
  }

  function closeDialog() {
    setDialogType(null)
    setSelectedComplaint(null)
  }

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  const baseColumns: ColumnDef<ComplaintListItem>[] = [
    {
      accessorKey: 'complaint_number',
      header: 'Complaint #',
      cell: ({ row }) => (
        <Link
          href={`/complaints/${row.original.id}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {row.original.complaint_number ?? row.original.raw_complaint_number}
        </Link>
      ),
    },
    {
      accessorKey: 'consumer_name',
      header: 'Consumer Name',
      cell: ({ row }) => (
        <Link
          href={`/complaints/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.consumer_name}
        </Link>
      ),
    },
    {
      accessorKey: 'consumer_mobile',
      header: 'Mobile',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.consumer_mobile}</span>
      ),
    },
    {
      accessorKey: 'nature_of_complaint',
      header: 'Nature',
      cell: ({ row }) => {
        const full = row.original.nature_of_complaint
        const display = full.length > 45 ? full.slice(0, 45) + '…' : full
        return (
          <span className="text-sm" title={full}>
            {display}
          </span>
        )
      },
    },
    {
      id: 'sub_division',
      header: 'Sub Division',
      cell: ({ row }) => row.original.sub_division?.name ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'assigned_to',
      header: 'Assigned To',
      cell: ({ row }) =>
        row.original.assigned_to_user?.full_name ?? (
          <span className="text-muted-foreground text-xs italic">Unassigned</span>
        ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
  ]

  const actionsColumn: ColumnDef<ComplaintListItem> = {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const complaint = row.original
      const isTerminal = complaint.status === 'closed' || complaint.status === 'rejected'

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Complaint actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/complaints/${complaint.id}`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isTerminal}
              onClick={() => !isTerminal && openDialog(complaint, 'assign')}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Assign Line Man
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isTerminal}
              onClick={() => !isTerminal && openDialog(complaint, 'status')}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }

  const columns: ColumnDef<ComplaintListItem>[] = isBackOffice
    ? [...baseColumns, actionsColumn]
    : baseColumns

  // ---------------------------------------------------------------------------
  // Table instance
  // ---------------------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <DataTable
        table={table}
        columns={columns}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => setParam('page', String(p))}
        emptyMessage="No complaints found."
      />

      <AssignComplaintDialog
        complaint={selectedComplaint}
        open={dialogType === 'assign'}
        onClose={closeDialog}
      />

      <UpdateStatusDialog
        complaint={selectedComplaint}
        open={dialogType === 'status'}
        onClose={closeDialog}
      />
    </>
  )
}
