'use client'

import { useRouter } from 'next/navigation'
import { UserForm } from '@/features/users/components/user-form'
import type { UserWithOffice, SubDivisionOption } from '@/features/users/queries/user.queries'

interface EditUserFormClientProps {
  user: UserWithOffice
  subDivisionOptions: SubDivisionOption[]
}

export function EditUserFormClient({ user, subDivisionOptions }: EditUserFormClientProps) {
  const router = useRouter()

  return (
    <UserForm
      user={user}
      subDivisionOptions={subDivisionOptions}
      onSuccess={() => router.push('/users')}
    />
  )
}
