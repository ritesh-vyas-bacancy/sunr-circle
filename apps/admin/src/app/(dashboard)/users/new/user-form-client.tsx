'use client'

import { useRouter } from 'next/navigation'
import { UserForm } from '@/features/users/components/user-form'
import type { SubDivisionOption } from '@/features/users/queries/user.queries'

interface UserFormClientProps {
  subDivisionOptions: SubDivisionOption[]
}

export function UserFormClient({ subDivisionOptions }: UserFormClientProps) {
  const router = useRouter()

  return (
    <UserForm
      subDivisionOptions={subDivisionOptions}
      onSuccess={() => router.push('/users')}
    />
  )
}
