// Server-side Supabase client utilities.
// NOTE: No 'use server' here — these are utility functions, not Server Actions.
// 'use server' belongs only in files that export Server Actions (e.g. *.actions.ts).
//
// NOTE: Database generic is omitted intentionally — hand-crafted types diverge from
// the Supabase type resolver format. Run `npm run db:types` after go-live to
// generate accurate types and re-add the generic. Runtime behaviour is unaffected.
import { createServerClient } from '@supabase/ssr'
import type { SetAllCookies } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<SupabaseClient<any>> {
  const cookieStore = await cookies()

  const setAll: SetAllCookies = (cookiesToSet) => {
    try {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    } catch {
      // Server Component — cookies set by middleware, ignore here
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll,
      },
    }
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): SupabaseClient<any> {
  // Uses service role key — bypasses RLS. For trusted server-side operations only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseAdminClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
