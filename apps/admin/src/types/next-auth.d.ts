import type { UserRole } from './database.types'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: UserRole
      organizationId: string
      subDivisionId: string | null
      fullName: string
    }
  }
  interface User {
    role: UserRole
    organizationId: string
    subDivisionId: string | null
    fullName: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    organizationId: string
    subDivisionId: string | null
    fullName: string
  }
}
