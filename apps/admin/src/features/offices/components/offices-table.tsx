'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table'
import { MoreHorizontal, Pencil, PowerOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/shared/data-table'

import { DeactivateOfficeDialog } from './deactivate-office-dialog'
import { useUrlParams } from '@/hooks/use-url-params'
import type { Office, OfficeType } from '@/types'

type OfficeWithParent = Office & {
  parent?: Pick<Office, 'id' | 'name' | 'code'>
}

interface OfficesTableProps {
  data: OfficeWithParent[]
  type: OfficeType
  showParentColumn?: boolean
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch?: string
  canManage?: boolean
}

function getTypeSlug(type: OfficeType): string {
  if (type === 'circle') return 'circles'
  if (type === 'division') return 'divisions'
  return 'sub-divisions'
}

export function OfficesTable({
  data,
  type,
  showParentColumn = false,
  totalCount,
  page,
  pageSize,
  totalPages,
  initialSearch = '',
  canManage = false,
}: OfficesTableProps) {
  const { setParam, getParam } = useUrlParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch)
  const [deactivatingOffice, setDeactivatingOffice] = useState<OfficeWithParent | null>(null)

  const typeSlug = getTypeSlug(type)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      startTransition(() => {
        setParam('search', value || null)
      })
    },
    [setParam]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      setParam('page', String(newPage))
    },
    [setParam]
  )

  const columns = useMemo<ColumnDef<OfficeWithParent>[]>(() => {
    const cols: ColumnDef<OfficeWithParent>[] = [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.code}</span>
        ),
        meta: { className: 'w-24' },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
    ]

    if (showParentColumn) {
      cols.push({
        id: 'parent',
        header: type === 'division' ? 'Circle' : 'Division',
        cell: ({ row }) =>
          row.original.parent ? (
            <span className="text-sm text-muted-foreground">
              <span className="font-mono">{row.original.parent.code}</span>{' '}
              {row.original.parent.name}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      })
    }

    cols.push(
      {
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
            {row.original.address || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
              Inactive
            </Badge>
          ),
        meta: { className: 'w-24' },
      }
    )

    if (canManage) {
      cols.push({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/offices/${typeSlug}/${row.original.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {row.original.is_active && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setDeactivatingOffice(row.original)}
                  >
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        meta: { className: 'w-12' },
      })
    }

    return cols
  }, [showParentColumn, type, typeSlug, canManage])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <>
      <DataTable
        table={table}
        columns={columns}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={`Search ${typeSlug}...`}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        emptyMessage={`No ${typeSlug} found.`}
      />

      {deactivatingOffice && (
        <DeactivateOfficeDialog
          office={deactivatingOffice}
          open={!!deactivatingOffice}
          onClose={() => setDeactivatingOffice(null)}
        />
      )}
    </>
  )
}
