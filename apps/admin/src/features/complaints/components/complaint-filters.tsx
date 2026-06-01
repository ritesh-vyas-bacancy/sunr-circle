'use client'

import { useEffect, useState } from 'react'
import { useUrlParams } from '@/hooks/use-url-params'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ComplaintFiltersProps {
  circles: Array<{ id: string; name: string; code: string }>
  divisions: Array<{ id: string; name: string; code: string; parent_id: string | null }>
  subDivisions: Array<{ id: string; name: string; code: string; parent_id: string | null }>
  lineMen: Array<{ id: string; full_name: string }>
  currentFilters: {
    search?: string
    circleId?: string
    divisionId?: string
    subDivisionId?: string
    status?: string
    assignedTo?: string
    dateFrom?: string
    dateTo?: string
  }
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
]

export function ComplaintFilters({
  circles,
  divisions,
  subDivisions,
  lineMen,
  currentFilters,
}: ComplaintFiltersProps) {
  const { setParam, setParams, getParam } = useUrlParams()

  // Local debounced search state
  const [localSearch, setLocalSearch] = useState(currentFilters.search ?? '')

  // Derived from URL
  const selectedCircleId = getParam('circleId')
  const selectedDivisionId = getParam('divisionId')

  // Debounce search → URL sync
  useEffect(() => {
    const timer = setTimeout(() => {
      setParam('search', localSearch || null)
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Keep local search in sync when URL param changes externally (e.g. clear filters)
  useEffect(() => {
    setLocalSearch(currentFilters.search ?? '')
  }, [currentFilters.search])

  const filteredDivisions = divisions.filter(
    (d) => !selectedCircleId || d.parent_id === selectedCircleId,
  )

  const filteredSubDivisions = subDivisions.filter(
    (s) => !selectedDivisionId || s.parent_id === selectedDivisionId,
  )

  function handleCircleChange(value: string) {
    setParams({
      circleId: value || null,
      divisionId: null,
      subDivisionId: null,
      page: null,
    })
  }

  function handleDivisionChange(value: string) {
    setParams({
      divisionId: value || null,
      subDivisionId: null,
      page: null,
    })
  }

  function handleFilterChange(key: string, value: string) {
    setParams({ [key]: value || null, page: null })
  }

  const hasActiveFilters = Boolean(
    currentFilters.search ||
      currentFilters.circleId ||
      currentFilters.divisionId ||
      currentFilters.subDivisionId ||
      currentFilters.status ||
      currentFilters.assignedTo ||
      currentFilters.dateFrom ||
      currentFilters.dateTo,
  )

  function handleClearFilters() {
    setLocalSearch('')
    setParams({
      search: null,
      circleId: null,
      divisionId: null,
      subDivisionId: null,
      status: null,
      assignedTo: null,
      dateFrom: null,
      dateTo: null,
      page: null,
    })
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Row 1: Search */}
      <Input
        placeholder="Search by complaint number, consumer name or mobile..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="w-full"
      />

      {/* Row 2: Cascading selects + date range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* Circle */}
        <Select value={currentFilters.circleId ?? ''} onValueChange={handleCircleChange}>
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

        {/* Division */}
        <Select value={currentFilters.divisionId ?? ''} onValueChange={handleDivisionChange}>
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

        {/* Sub Division */}
        <Select
          value={currentFilters.subDivisionId ?? ''}
          onValueChange={(v) => handleFilterChange('subDivisionId', v)}
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

        {/* Status */}
        <Select
          value={currentFilters.status ?? ''}
          onValueChange={(v) => handleFilterChange('status', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || '__all__'} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Line Man */}
        <Select
          value={currentFilters.assignedTo ?? ''}
          onValueChange={(v) => handleFilterChange('assignedTo', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Line Men" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Line Men</SelectItem>
            {lineMen.map((lm) => (
              <SelectItem key={lm.id} value={lm.id}>
                {lm.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          value={currentFilters.dateFrom ?? ''}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          aria-label="Date from"
        />

        {/* Date To */}
        <Input
          type="date"
          value={currentFilters.dateTo ?? ''}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          aria-label="Date to"
        />
      </div>

      {/* Row 3: Clear Filters — only when a filter is active */}
      {hasActiveFilters && (
        <div>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
