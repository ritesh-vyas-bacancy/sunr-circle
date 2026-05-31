'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '../schemas/user.schema'
import type { AppUser, ActionResult } from '@/types'

export async function createUser(data: CreateUserInput): Promise<ActionResult<AppUser>> {
  const session = await requireRole(['back_office'])
  const parsed = createUserSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const adminClient = createAdminClient()

  // Step 1: Create auth user via Admin API (auto-confirms email)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  })
  if (authError) return { success: false, error: authError.message }

  // Step 2: Create public user profile
  const supabase = createAdminClient()
  const { data: user, error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      organization_id: session.user.organizationId,
      role: parsed.data.role,
      full_name: parsed.data.full_name,
      employee_id: parsed.data.employee_id || null,
      mobile_number: parsed.data.mobile_number || null,
      sub_division_id: parsed.data.sub_division_id || null,
      is_active: true,
    })
    .select()
    .single()

  if (profileError) {
    // Rollback: delete auth user if profile insertion fails
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: profileError.message }
  }

  revalidatePath('/users')
  return { success: true, data: user as AppUser }
}

export async function updateUser(
  id: string,
  data: UpdateUserInput,
): Promise<ActionResult<AppUser>> {
  await requireRole(['back_office'])
  const parsed = updateUserSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...(parsed.data.full_name !== undefined && { full_name: parsed.data.full_name }),
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      ...(parsed.data.is_active !== undefined && { is_active: parsed.data.is_active }),
      employee_id: parsed.data.employee_id || null,
      mobile_number: parsed.data.mobile_number || null,
      // Clear sub_division when role does not require it
      sub_division_id:
        parsed.data.role && ['back_office', 'top_management'].includes(parsed.data.role)
          ? null
          : parsed.data.sub_division_id || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/users')
  revalidatePath(`/users/${id}/edit`)
  return { success: true, data: user as AppUser }
}

export async function deactivateUser(id: string): Promise<ActionResult<void>> {
  await requireRole(['back_office'])
  const adminClient = createAdminClient()
  const supabase = createAdminClient()

  // Ban in Supabase Auth â€” prevents any new logins (10 years)
  const { error: banError } = await adminClient.auth.admin.updateUserById(id, {
    ban_duration: '87600h',
  })
  if (banError) return { success: false, error: banError.message }

  // Mark inactive in public profile
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/users')
  return { success: true, data: undefined }
}

export async function resetUserPassword(
  id: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  await requireRole(['back_office'])
  if (newPassword.length < 8)
    return { success: false, error: 'Password must be at least 8 characters' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(id, { password: newPassword })
  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}
