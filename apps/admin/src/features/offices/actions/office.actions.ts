'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import {
  circleSchema,
  divisionSchema,
  subDivisionSchema,
  type CircleInput,
  type DivisionInput,
  type SubDivisionInput,
} from '../schemas/office.schema'
import type { Office, OfficeType, ActionResult } from '@/types'

export async function createOffice(
  type: OfficeType,
  data: CircleInput | DivisionInput | SubDivisionInput
): Promise<ActionResult<Office>> {
  const session = await requireRole(['back_office'])
  const schema =
    type === 'circle'
      ? circleSchema
      : type === 'division'
        ? divisionSchema
        : subDivisionSchema

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { data: office, error } = await supabase
    .from('offices')
    .insert({
      ...parsed.data,
      organization_id: session.user.organizationId,
      office_type: type,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'An office with this code already exists.' }
    return { success: false, error: error.message }
  }

  revalidatePath('/offices/circles')
  revalidatePath('/offices/divisions')
  revalidatePath('/offices/sub-divisions')
  return { success: true, data: office as Office }
}

export async function updateOffice(
  id: string,
  data: Partial<CircleInput | DivisionInput | SubDivisionInput>
): Promise<ActionResult<Office>> {
  await requireRole(['back_office'])
  const supabase = createAdminClient()
  const { data: office, error } = await supabase
    .from('offices')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/offices/circles')
  revalidatePath('/offices/divisions')
  revalidatePath('/offices/sub-divisions')
  return { success: true, data: office as Office }
}

export async function deactivateOffice(id: string): Promise<ActionResult<void>> {
  await requireRole(['back_office'])
  const supabase = createAdminClient()

  const { count: childCount } = await supabase
    .from('offices')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', id)
    .eq('is_active', true)

  if (childCount && childCount > 0) {
    return {
      success: false,
      error: 'This office has active child offices. Deactivate them first.',
    }
  }

  const { error } = await supabase.from('offices').update({ is_active: false }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/offices/circles')
  revalidatePath('/offices/divisions')
  revalidatePath('/offices/sub-divisions')
  return { success: true, data: undefined }
}
