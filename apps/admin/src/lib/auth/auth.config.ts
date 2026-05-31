import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const adminClient = createAdminClient()

        // Sign in via Supabase Auth (anon key) to validate credentials
        const supabaseClient = (await import('@supabase/supabase-js')).createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        })

        if (authError || !authData.user) return null

        // Fetch profile from public.users using service role (bypasses RLS)
        const { data: profile } = await adminClient
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .eq('is_active', true)
          .single()

        if (!profile) return null

        return {
          id: profile.id,
          email: authData.user.email ?? '',
          role: profile.role as UserRole,
          organizationId: profile.organization_id,
          subDivisionId: profile.sub_division_id,
          fullName: profile.full_name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.subDivisionId = user.subDivisionId
        token.fullName = user.fullName
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? ''
      session.user.role = token.role as UserRole
      session.user.organizationId = token.organizationId as string
      session.user.subDivisionId = token.subDivisionId as string | null
      session.user.fullName = token.fullName as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.AUTH_SECRET,
})
