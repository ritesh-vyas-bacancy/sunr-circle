'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Pencil, KeyRound, Ban, MoreHorizontal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { formatDateTime } from '@/lib/utils'
import { getRoleLabel } from '@/lib/utils'
import type { UserRole } from '@/types'
import type { PaginatedResult } from '@/types'
import type { UserWithOffice } from '../queries/user.queries'
import { DeactivateUserDialog } from './deactivate-user-dialog'
import { ResetPasswordDialog } from './reset-password-dialog'

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  back_office: 'bg-blue-100 text-blue-800 border-blue-200',
  call_centre: 'bg-purple-100 text-purple-800 border-purple-200',
  line_man: 'bg-amber-100 text-amber-800 border-amber-200',
  top_management: 'bg-green-100 text-green-800 border-green-200',
}

const ROLE_OPTIONS: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'back_office', label: 'Back Office' },
  { value: 'call_centre', label: 'Call Centre' },
  { value: 'line_man', label: 'Line Man' },
  { value: 'top_management', label: 'Top Management' },
]

interface UsersTableProps {
  result: PaginatedResult<UserWithOffice>
  canManage: boolean
}

export function UsersTable({ result, canManage }: UsersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [deactivateUser, setDeactivateUser] = useState<UserWithOffice | null>(null)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset page when filtering
      if (key !== 'page') params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams],
  )

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParam('search', searchValue || null)
  }

  const columns: ColumnDef<UserWithOffice>[] = [
    {
      accessorKey: 'employee_id',
      header: 'Employee ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.employee_id ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'full_name',
      header: 'Full Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.full_name}</p>
          {row.original.mobile_number && (
            <p className="text-xs text-muted-foreground">{row.original.mobile_number}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_CLASS[row.original.role]}`}
        >
          {getRoleLabel(row.original.role)}
        </span>
      ),
    },
    {
      id: 'sub_division',
      header: 'Sub Division',
      cell: ({ row }) =>
        row.original.office ? (
          <span className="text-sm">
            {row.original.office.name}{' '}
            <span className="text-xs text-muted-foreground">({row.original.office.code})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'mobile_number',
      header: 'Mobile',
      cell: ({ row }) => row.original.mobile_number ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="default" className="bg-green-600 hover:bg-green-600/90">
            Active
          </Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        ),
    },
    {
      accessorKey: 'last_login_at',
      header: 'Last Login',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.last_login_at)}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: { original: UserWithOffice } }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/users/${row.original.id}/edit`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResetUserId(row.original.id)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </DropdownMenuItem>
                  {row.original.is_active && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeactivateUser(row.original)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          } satisfies ColumnDef<UserWithOffice>,
        ]
      : []),
  ]

  const table = useReactTable({
    data: result.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: result.totalPages,
  })

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={searchParams.get('role') ?? 'all'}
          onValueChange={(v) => updateParam('role', v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <Input
            placeholder="Search by name..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" size="default">
            Search
          </Button>
          {(searchParams.get('search') || searchParams.get('role')) && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => {
                setSearchValue('')
                router.push(pathname)
              }}
            >
              Clear
            </Button>
          )}
        </form>

        <p className="text-sm text-muted-foreground sm:ml-auto">
          {result.count} user{result.count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={result.page <= 1}
              onClick={() => updateParam('page', String(result.page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={result.page >= result.totalPages}
              onClick={() => updateParam('page', String(result.page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {deactivateUser && (
        <DeactivateUserDialog
          user={deactivateUser}
          open={!!deactivateUser}
          onClose={() => setDeactivateUser(null)}
        />
      )}
      {resetUserId && (
        <ResetPasswordDialog
          userId={resetUserId}
          open={!!resetUserId}
          onClose={() => setResetUserId(null)}
        />
      )}
    </div>
  )
}
