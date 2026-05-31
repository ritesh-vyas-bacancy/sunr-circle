'use server'
import { createAdminClient } from '@/lib/supabase/server'
import type { AppUser, UserRole, Office, PaginatedResult } from '@/types'

export type UserWithOffice = AppUser & {
  office: Pick<Office, 'id' | 'name' | 'code'> | null
}

export type SubDivisionOption = {
  id: string; name: string; code: string; division_name?: string
}

export async function getUsers(
  orgId: string,
  params?: {
    role?: UserRole; search?: string; page?: number; pageSize?: number; includeInactive?: boolean
  }
): Promise<PaginatedResult<UserWithOffice>> {
  const { role, search, page = 1, pageSize = 20, includeInactive = false } = params ?? {}
  const supabase = createAdminClient()

  let query = supabase
    .from('users')
    .select('*, office:sub_division_id(id, name, code)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('full_name', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (role) query = query.eq('role', role)
  if (search) query = query.ilike('full_name', `%${search}%`)
  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as UserWithOffice[],
    count: count ?? 0, page, pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getUserById(id: string): Promise<UserWithOffice | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('users').select('*, office:sub_division_id(id, name, code)').eq('id', id).single()
  return (data as UserWithOffice | null) ?? null
}

export async function getSubDivisionsForSelect(orgId: string): Promise<SubDivisionOption[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('offices').select('id, name, code, parent:parent_id(name)')
    .eq('organization_id', orgId).eq('office_type', 'sub_division').eq('is_active', true).order('code')
  return (data ?? []).map((d) => ({
    id: d.id, name: d.name, code: d.code,
    division_name: (d.parent as unknown as { name: string } | null)?.name,
  }))
}
