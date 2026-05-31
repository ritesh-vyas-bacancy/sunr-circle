'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

import { assignComplaint } from '@/features/complaints/actions/complaint.actions'
import { getLineManForSubDivision } from '@/features/complaints/queries/complaint.queries'
import type { ComplaintListItem } from '@/features/complaints/queries/complaint.queries'

interface LineMan {
  id: string
  full_name: string
  mobile_number: string | null
  employee_id: string | null
}

interface AssignComplaintDialogProps {
  complaint: ComplaintListItem | null
  open: boolean
  onClose: () => void
}

export function AssignComplaintDialog({ complaint, open, onClose }: AssignComplaintDialogProps) {
  const [lineMen, setLineMen] = useState<LineMan[]>([])
  const [selectedLineManId, setSelectedLineManId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !complaint?.sub_division_id) {
      setLineMen([])
      setSelectedLineManId('')
      setError(null)
      return
    }

    let cancelled = false

    async function fetchLineMen() {
      setLoading(true)
      setError(null)
      try {
        const result = await getLineManForSubDivision(complaint!.sub_division_id)
        if (!cancelled) {
          setLineMen(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Line Men.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchLineMen()

    return () => {
      cancelled = true
    }
  }, [complaint?.sub_division_id, open])

  async function handleSubmit() {
    if (!complaint || !selectedLineManId) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await assignComplaint(complaint.id, { line_man_id: selectedLineManId })
      if (result.success) {
        toast.success('Line Man assigned successfully')
        onClose()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const complaintLabel =
    complaint?.complaint_number ?? complaint?.raw_complaint_number ?? ''

  const subDivisionName = complaint?.sub_division?.name

  const isSubmitDisabled = !selectedLineManId || submitting || lineMen.length === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !submitting) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Line Man</DialogTitle>
          <DialogDescription>
            Complaint: <span className="font-medium text-foreground">{complaintLabel}</span>
            {subDivisionName && (
              <>
                {' '}
                &mdash; Sub Division:{' '}
                <span className="font-medium text-foreground">{subDivisionName}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : lineMen.length === 0 ? (
            <Alert>
              <AlertTitle>No Line Men Available</AlertTitle>
              <AlertDescription>
                No active Line Men found in this Sub Division. Please add Line Men in User
                Management first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Line Man</label>
              <Select value={selectedLineManId} onValueChange={setSelectedLineManId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a Line Man..." />
                </SelectTrigger>
                <SelectContent>
                  {lineMen.map((lm) => {
                    const label = [
                      lm.employee_id ? `${lm.employee_id} — ` : '',
                      lm.full_name,
                      lm.mobile_number ? ` · ${lm.mobile_number}` : '',
                    ].join('')
                    return (
                      <SelectItem key={lm.id} value={lm.id}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && !loading && lineMen.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
