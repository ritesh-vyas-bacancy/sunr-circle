export * from './database.types'

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export type SearchParams = Record<string, string | string[] | undefined>

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
