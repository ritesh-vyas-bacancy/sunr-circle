import { auth } from '@/lib/auth/auth.config'
import type { UserRole } from '@/types'
import { redirect } from 'next/navigation'

export async function getServerSession() {
  return auth()
}

export async function requireSession() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireSession()
  if (!roles.includes(session.user.role)) redirect('/dashboard')
  return session
}
