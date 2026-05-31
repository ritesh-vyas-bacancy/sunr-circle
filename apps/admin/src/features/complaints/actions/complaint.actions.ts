'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import {
  createComplaintSchema,
  assignComplaintSchema,
  updateStatusSchema,
  type CreateComplaintInput,
  type AssignComplaintInput,
  type UpdateStatusInput,
} from '../schemas/complaint.schema'
import type { Complaint, ActionResult } from '@/types'

// â”€â”€â”€ Server Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createComplaint(
  data: CreateComplaintInput,
): Promise<ActionResult<Complaint>> {
  const session = await requireRole(['back_office'])

  const parsed = createComplaintSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = createAdminClient()

  // Supabase query-builder infers insert/update payload types as `never` when the
  // Database generic cannot fully resolve the table's Insert type â€” cast via `any`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: complaint, error } = await (supabase.from('complaints') as any)
    .insert({
      organization_id: session.user.organizationId,
      sub_division_id: parsed.data.sub_division_id,
      raw_complaint_number: parsed.data.raw_complaint_number,
      consumer_name: parsed.data.consumer_name,
      consumer_mobile: parsed.data.consumer_mobile,
      nature_of_complaint: parsed.data.nature_of_complaint,
      complaint_remarks: parsed.data.complaint_remarks || null,
      created_by: session.user.id,
      status: 'open',
      assigned_to: null,
      attend_remarks: null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Complaint number already exists for this Sub Division.',
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/complaints')
  return { success: true, data: complaint as Complaint }
}

export async function assignComplaint(
  complaintId: string,
  data: AssignComplaintInput,
): Promise<ActionResult<Complaint>> {
  await requireRole(['back_office'])

  const parsed = assignComplaintSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = createAdminClient()

  // Fetch current status before updating
  const { data: existing, error: fetchError } = await supabase
    .from('complaints')
    .select('status')
    .eq('id', complaintId)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Complaint not found.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentStatus = (existing as any).status as string

  if (currentStatus === 'closed' || currentStatus === 'rejected') {
    return {
      success: false,
      error: `Complaint is already ${currentStatus} and cannot be assigned.`,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (supabase.from('complaints') as any)
    .update({
      assigned_to: parsed.data.line_man_id,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })
    .eq('id', complaintId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/complaints')
  revalidatePath('/complaints/' + complaintId)
  return { success: true, data: updated as Complaint }
}

export async function updateComplaintStatus(
  complaintId: string,
  data: UpdateStatusInput,
): Promise<ActionResult<Complaint>> {
  await requireRole(['back_office'])

  const parsed = updateStatusSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = createAdminClient()

  // Fetch current status before updating
  const { data: existing, error: fetchError } = await supabase
    .from('complaints')
    .select('status')
    .eq('id', complaintId)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Complaint not found.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentStatus = (existing as any).status as string

  if (currentStatus === 'closed' || currentStatus === 'rejected') {
    return {
      success: false,
      error: `Complaint is already ${currentStatus} and cannot be changed.`,
    }
  }

  const now = new Date().toISOString()

  const updatePayload: Record<string, unknown> = {
    status: parsed.data.status,
    attend_remarks: parsed.data.attend_remarks || null,
  }
  if (parsed.data.status === 'in_progress') {
    updatePayload.in_progress_at = now
  } else if (parsed.data.status === 'closed' || parsed.data.status === 'rejected') {
    updatePayload.closed_at = now
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (supabase.from('complaints') as any)
    .update(updatePayload)
    .eq('id', complaintId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/complaints')
  revalidatePath('/complaints/' + complaintId)
  return { success: true, data: updated as Complaint }
}
