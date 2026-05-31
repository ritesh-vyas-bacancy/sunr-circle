'use server'
// Uses createAdminClient (service role) to bypass RLS — server-side only, safe.
// The app uses NextAuth JWTs, not Supabase JWTs, so the regular Supabase client
// has no authenticated session and all RLS policies would block queries.
import { createAdminClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/session'
import type { Organization } from '@/types'

export async function getOrganisation(): Promise<Organization | null> {
  const supabase = createAdminClient()
  const session = await requireSession()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', session.user.organizationId)
    .maybeSingle()
  return data as Organization | null
}
