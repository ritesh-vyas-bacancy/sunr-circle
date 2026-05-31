import { z } from 'zod'
import type { ComplaintStatus } from '@/types'

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const createComplaintSchema = z.object({
  consumer_name: z
    .string()
    .min(2, 'Consumer name must be at least 2 characters')
    .max(200, 'Consumer name must be at most 200 characters'),
  consumer_mobile: z
    .string()
    .regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  nature_of_complaint: z
    .string()
    .min(2, 'Nature of complaint must be at least 2 characters')
    .max(500, 'Nature of complaint must be at most 500 characters'),
  complaint_remarks: z
    .string()
    .max(1000, 'Complaint remarks must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  sub_division_id: z.string().uuid('Sub Division is required'),
  raw_complaint_number: z
    .string()
    .min(1, 'Complaint number is required')
    .max(50, 'Complaint number must be at most 50 characters')
    .regex(
      /^[A-Za-z0-9\-\/]+$/,
      'Complaint number may only contain letters, digits, hyphens, and slashes',
    )
    .transform((val) => val.trim().toUpperCase()),
})

export const assignComplaintSchema = z.object({
  line_man_id: z.string().uuid('A Line Man must be selected'),
})

export const updateStatusSchema = z.object({
  status: z.enum(['in_progress', 'closed', 'rejected'], {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status value',
  }),
  attend_remarks: z
    .string()
    .max(1000, 'Attend remarks must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
})

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>
export type AssignComplaintInput = z.infer<typeof assignComplaintSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

// ─── Status Options ──────────────────────────────────────────────────────────

export const complaintStatusOptions: Array<{ value: ComplaintStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
]

// ─── Status Transitions ──────────────────────────────────────────────────────

export const complaintStatusTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  open: ['rejected'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['closed', 'rejected'],
  closed: [],
  rejected: [],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStatusLabel(status: ComplaintStatus): string {
  return complaintStatusOptions.find((o) => o.value === status)?.label ?? status
}
