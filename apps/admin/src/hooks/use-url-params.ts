'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

export function useUrlParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string | null | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value == null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      // Reset page on non-page param changes
      if (key !== 'page') {
        params.delete('page')
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const setParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const getParam = useCallback(
    (key: string, defaultValue = '') => {
      return searchParams.get(key) ?? defaultValue
    },
    [searchParams]
  )

  return { setParam, setParams, getParam, isPending }
}
