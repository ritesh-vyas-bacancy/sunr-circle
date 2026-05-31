'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Zap, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schemas/auth.schema'
import { forgotPasswordAction } from '@/features/auth/actions/auth.actions'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: ForgotPasswordInput) {
    setErrorMessage(null)
    const result = await forgotPasswordAction(values)
    if (result.success) {
      setSubmittedEmail(values.email)
      setSubmitted(true)
    } else {
      setErrorMessage(result.error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Banner */}
      <header className="bg-[#1a3d7c] py-4 px-6 flex items-center gap-3 shadow-md">
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-white text-lg font-bold tracking-wide">SUNR Circle</span>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-[#1a3d7c] px-6 py-5">
              <h1 className="text-xl font-bold text-white">Reset Password</h1>
              <p className="text-blue-200 text-sm mt-1">
                Enter your email to receive a reset link
              </p>
            </div>

            <div className="px-6 py-7">
              {submitted ? (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mx-auto mb-4">
                    <MailCheck className="h-7 w-7 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
                  <p className="text-sm text-gray-600 mb-1">
                    We sent a password reset link to
                  </p>
                  <p className="text-sm font-medium text-gray-900 mb-6">{submittedEmail}</p>
                  <p className="text-xs text-gray-500 mb-6">
                    If you don&apos;t see it, check your spam folder. The link expires in 1 hour.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSubmitted(false)
                      form.reset()
                    }}
                  >
                    Try a different email
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter your official email address and we will send you a link to reset your
                    password.
                  </p>

                  {errorMessage && (
                    <Alert variant="destructive" className="mb-5">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="h-11 text-base"
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold bg-[#1a3d7c] hover:bg-[#112855] text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                    </form>
                  </Form>
                </>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#1a3d7c] hover:underline font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center">
        <p className="text-xs text-gray-500">
          SUNR Circle Electricity Utility | Complaint Management System
        </p>
      </footer>
    </div>
  )
}
