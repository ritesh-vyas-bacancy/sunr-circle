'use server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Office, OfficeType, PaginatedResult } from '@/types'

export async function getOffices(
  orgId: string,
  params?: {
    type?: OfficeType; parentId?: string; search?: string
    page?: number; pageSize?: number; includeInactive?: boolean
  }
): Promise<PaginatedResult<Office & { parent?: Pick<Office, 'id' | 'name' | 'code'> }>> {
  const { type, parentId, search, page = 1, pageSize = 20, includeInactive = false } = params ?? {}
  const supabase = createAdminClient()

  let query = supabase
    .from('offices')
    .select('*, parent:parent_id(id, name, code)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('code', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (type) query = query.eq('office_type', type)
  if (parentId) query = query.eq('parent_id', parentId)
  if (search) query = query.ilike('name', '%' + search + '%')
  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as (Office & { parent?: Pick<Office, 'id' | 'name' | 'code'> })[],
    count: count ?? 0, page, pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getOfficeById(id: string): Promise<(Office & { parent?: Pick<Office, 'id' | 'name' | 'code'> }) | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('offices').select('*, parent:parent_id(id, name, code)').eq('id', id).single()
  return data as (Office & { parent?: Pick<Office, 'id' | 'name' | 'code'> }) | null
}

export async function getOfficesForSelect(
  orgId: string,
  type: OfficeType
): Promise<Array<{ id: string; name: string; code: string }>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('offices').select('id, name, code')
    .eq('organization_id', orgId).eq('office_type', type).eq('is_active', true).order('code')
  return (data ?? []) as { id: string; name: string; code: string }[]
}
