'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import {
  organisationInfoSchema,
  organisationThemeSchema,
  type OrganisationInfoInput,
  type OrganisationThemeInput,
} from '../schemas/organisation.schema'
import type { Organization, ActionResult } from '@/types'

export async function updateOrganisationInfo(
  data: OrganisationInfoInput,
): Promise<ActionResult<Organization>> {
  const session = await requireRole(['back_office'])
  const parsed = organisationInfoSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { data: org, error } = await supabase
    .from('organizations')
    .update({
      name: parsed.data.name,
      short_name: parsed.data.short_name,
      support_email: parsed.data.support_email || null,
      support_phone: parsed.data.support_phone || null,
    })
    .eq('id', session.user.organizationId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/organisation')
  return { success: true, data: org as Organization }
}

export async function updateOrganisationTheme(
  data: OrganisationThemeInput,
): Promise<ActionResult<Organization>> {
  const session = await requireRole(['back_office'])
  const parsed = organisationThemeSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { data: org, error } = await supabase
    .from('organizations')
    .update({
      primary_color: parsed.data.primary_color,
      secondary_color: parsed.data.secondary_color,
    })
    .eq('id', session.user.organizationId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/organisation')
  return { success: true, data: org as Organization }
}

export async function uploadOrganisationLogo(
  formData: FormData,
): Promise<ActionResult<string>> {
  const session = await requireRole(['back_office'])
  const file = formData.get('logo') as File | null
  if (!file) return { success: false, error: 'No file selected' }
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'File size must be under 5 MB' }
  if (!file.type.startsWith('image/')) return { success: false, error: 'Only image files are allowed' }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${session.user.organizationId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_ORG_ASSETS_BUCKET ?? 'org-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from(process.env.NEXT_PUBLIC_ORG_ASSETS_BUCKET ?? 'org-assets')
    .getPublicUrl(path)

  const logoUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', session.user.organizationId)

  if (updateError) return { success: false, error: updateError.message }
  revalidatePath('/organisation')
  return { success: true, data: logoUrl }
}
