'use server'

import { signIn, signOut } from '@/lib/auth/auth.config'
import type { LoginInput, ForgotPasswordInput } from '../schemas/auth.schema'
import type { ActionResult } from '@/types'
import { AuthError } from 'next-auth'

export async function loginAction(data: LoginInput): Promise<ActionResult<void>> {
  try {
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: 'Invalid email or password. Please check your credentials.',
      }
    }
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' })
}

export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<ActionResult<void>> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: process.env.AUTH_URL + '/reset-password',
    })
    if (error) return { success: false, error: error.message }
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to send reset email. Please try again.' }
  }
}
