'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { StatusBadge } from '@/components/shared/status-badge'
import {
  updateStatusSchema,
  complaintStatusTransitions,
  complaintStatusOptions,
  getStatusLabel,
  type UpdateStatusInput,
} from '@/features/complaints/schemas/complaint.schema'
import { updateComplaintStatus } from '@/features/complaints/actions/complaint.actions'
import type { ComplaintListItem } from '@/features/complaints/queries/complaint.queries'

interface UpdateStatusDialogProps {
  complaint: ComplaintListItem | null
  open: boolean
  onClose: () => void
}

export function UpdateStatusDialog({ complaint, open, onClose }: UpdateStatusDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const allowedStatuses = complaint
    ? complaintStatusTransitions[complaint.status]
        .map((s) => complaintStatusOptions.find((o) => o.value === s))
        .filter((o): o is NonNullable<typeof o> => Boolean(o))
    : []

  const form = useForm<UpdateStatusInput>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: undefined,
      attend_remarks: '',
    },
  })

  const watchedStatus = form.watch('status')

  async function onSubmit(data: UpdateStatusInput) {
    if (!complaint) return

    // Extra guard for rejected status requiring a reason
    if (data.status === 'rejected' && !data.attend_remarks?.trim()) {
      setServerError('Rejection reason is required.')
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const result = await updateComplaintStatus(complaint.id, data)
      if (result.success) {
        toast.success(`Status updated to ${getStatusLabel(data.status)}`)
        form.reset()
        onClose()
      } else {
        setServerError(result.error)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v && !submitting) {
      form.reset()
      setServerError(null)
      onClose()
    }
  }

  const complaintLabel =
    complaint?.complaint_number ?? complaint?.raw_complaint_number ?? ''

  const remarksLabel =
    watchedStatus === 'rejected' ? 'Rejection Reason *' : 'Attend Remarks (optional)'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Complaint Status</DialogTitle>
          <DialogDescription>
            Complaint: <span className="font-medium text-foreground">{complaintLabel}</span>
          </DialogDescription>
        </DialogHeader>

        {allowedStatuses.length === 0 ? (
          <>
            <Alert>
              <AlertTitle>No Transitions Available</AlertTitle>
              <AlertDescription>
                This complaint is{' '}
                <span className="font-semibold">
                  {complaint ? getStatusLabel(complaint.status) : '—'}
                </span>{' '}
                and cannot be updated further.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Current status display */}
              {complaint && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <StatusBadge status={complaint.status} />
                </div>
              )}

              {/* New Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedStatuses.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attend / Rejection Remarks */}
              <FormField
                control={form.control}
                name="attend_remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{remarksLabel}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          watchedStatus === 'rejected'
                            ? 'Provide a reason for rejection...'
                            : 'Add notes about this status change...'
                        }
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Server error */}
              {serverError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Status
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
