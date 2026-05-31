'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { createUserSchema, updateUserSchema } from '../schemas/user.schema'
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schema'
import { createUser, updateUser } from '../actions/user.actions'
import type { UserWithOffice, SubDivisionOption } from '../queries/user.queries'

const ROLE_OPTIONS = [
  { value: 'back_office', label: 'Back Office' },
  { value: 'call_centre', label: 'Call Centre' },
  { value: 'line_man', label: 'Line Man' },
  { value: 'top_management', label: 'Top Management' },
] as const

const ROLES_REQUIRING_SUBDIVISION = ['call_centre', 'line_man']

interface UserFormProps {
  user?: UserWithOffice
  subDivisionOptions: SubDivisionOption[]
  onSuccess?: () => void
}

export function UserForm({ user, subDivisionOptions, onSuccess }: UserFormProps) {
  const isEdit = !!user
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: isEdit
      ? {
          full_name: user.full_name,
          role: user.role,
          employee_id: user.employee_id ?? '',
          mobile_number: user.mobile_number ?? '',
          sub_division_id: user.sub_division_id ?? '',
          is_active: user.is_active,
        }
      : {
          full_name: '',
          email: '',
          password: '',
          role: 'back_office',
          employee_id: '',
          mobile_number: '',
          sub_division_id: '',
        },
  })

  const watchedRole = form.watch('role')
  const requiresSubDivision =
    watchedRole != null && ROLES_REQUIRING_SUBDIVISION.includes(watchedRole)

  // Clear sub_division_id when role no longer requires it
  useEffect(() => {
    if (!requiresSubDivision) {
      form.setValue('sub_division_id', '')
      form.clearErrors('sub_division_id')
    }
  }, [requiresSubDivision, form])

  function onSubmit(values: CreateUserInput | UpdateUserInput) {
    startTransition(async () => {
      let result
      if (isEdit) {
        result = await updateUser(user.id, values as UpdateUserInput)
      } else {
        result = await createUser(values as CreateUserInput)
      }

      if (result.success) {
        toast.success(isEdit ? 'User updated successfully.' : 'User created successfully.')
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ramesh Kumar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email — create mode only */}
        {!isEdit && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="user@example.com" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Password — create mode only */}
        {!isEdit && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Role */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sub Division — visible only when role requires it */}
        {requiresSubDivision && (
          <FormField
            control={form.control}
            name="sub_division_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub Division *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub division" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subDivisionOptions.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No sub divisions available
                      </div>
                    ) : (
                      subDivisionOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.division_name
                            ? `${opt.division_name} > ${opt.name} (${opt.code})`
                            : `${opt.name} (${opt.code})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Employee ID */}
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g. EMP001" maxLength={20} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mobile Number */}
        <FormField
          control={form.control}
          name="mobile_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  inputMode="numeric"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="min-w-[120px]">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
